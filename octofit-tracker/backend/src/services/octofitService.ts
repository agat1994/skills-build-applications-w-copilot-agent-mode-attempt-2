import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

const httpError = (status: number, message: string) => Object.assign(new Error(message), { status });

function asObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw httpError(400, 'Request body must be an object');
  }
  return input as Record<string, any>;
}

function requireId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw httpError(400, `${field} must be a valid id`);
  }
  return value;
}

const POINTS_PER_MINUTE: Record<string, number> = {
  run: 10,
  running: 10,
  cycle: 8,
  cycling: 8,
  swimming: 9,
  strength: 7,
  walking: 4,
  yoga: 3,
};

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = asObject(input);
  const userId = requireId(body.userId, 'userId');
  const teamId = requireId(body.teamId, 'teamId');
  if (typeof body.type !== 'string' || !body.type.trim()) {
    throw httpError(400, 'type is required');
  }
  const minutes = body.minutes;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'minutes must be a positive number');
  }
  if (!(await User.exists({ _id: userId }))) throw httpError(404, 'User not found');
  if (!(await Team.exists({ _id: teamId }))) throw httpError(404, 'Team not found');

  const type = body.type.trim();
  const rate = POINTS_PER_MINUTE[type.toLowerCase()] ?? 5;
  const created = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: Math.round(minutes * rate),
    occurredAt: new Date(),
  });
  return created.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = asObject(input);
  if (typeof body.name !== 'string' || !body.name.trim()) {
    throw httpError(400, 'name is required');
  }
  if (typeof body.mascot !== 'string' || !body.mascot.trim()) {
    throw httpError(400, 'mascot is required');
  }
  let members: string[] = [];
  if (body.members !== undefined) {
    if (!Array.isArray(body.members)) throw httpError(400, 'members must be an array');
    members = body.members.map((member) => requireId(member, 'members[]'));
    const unique = [...new Set(members)];
    const count = await User.countDocuments({ _id: { $in: unique } });
    if (count !== unique.length) throw httpError(404, 'One or more members not found');
  }
  const created = await Team.create({
    name: body.name.trim(),
    mascot: body.mascot.trim(),
    members,
  });
  return created.toObject();
}

export async function getLeaderboard() {
  const totals = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  if (typeof userEmail !== 'string' || !userEmail.trim()) {
    throw httpError(400, 'email is required');
  }
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');

  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const findWorkout = (value: string) => {
    const pattern = new RegExp(escapeRegex(value), 'i');
    return Workout.findOne({ $or: [{ focus: pattern }, { title: pattern }] }).lean();
  };

  const goal = user.fitnessGoal.trim();
  if (goal) {
    const workout = await findWorkout(goal);
    if (workout) return [{ ...workout, reason: `Matches your ${goal} goal.` }];
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  if (recentActivity?.type) {
    const activityType = recentActivity.type;
    const focus = /^(run|running|cycle|cycling|swim|swimming)$/i.test(activityType)
      ? 'endurance'
      : activityType;
    const workout = await findWorkout(focus);
    if (workout) {
      return [{ ...workout, reason: `Recommended based on your recent ${activityType} activity.` }];
    }
  }

  return [];
}

export { User };
