import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs';
import { userRouter } from './routes/user'
import { blogRouter } from './routes/blog'



// Create the main Hono app

type HonoEnv = {
	DATABASE_URL: string,
	JWT_SECRET: string,
}
const app = new Hono<{ Bindings: HonoEnv }>();

app.route('/api/v1/user', userRouter)
app.route('/api/v1/blog', blogRouter)

export default app
