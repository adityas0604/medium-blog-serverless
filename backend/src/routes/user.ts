import {Hono} from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs';

type HonoEnv = {
	DATABASE_URL: string,
	JWT_SECRET: string,
}

export const userRouter = new Hono<{ Bindings: HonoEnv }>();

userRouter.post('/signup', async (c) => {
	const prisma = new PrismaClient({
    	datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	const body = await c.req.json()

	const user = await prisma.user.create ({
		data: {
			email: body.email,
			password: await bcrypt.hash(body.password, 5)
		}
	});

	const payload = {
		id: user.id,
	}

	const token = await sign(payload, c.env.JWT_SECRET)

	return c.json({ jwt: token })
})

userRouter.post('/api/v1/signin', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	if (!body.email || !body.password) {
		c.status(400);
		return c.json({ error: "email and password are required" });
	}

	const user = await prisma.user.findUnique({
		where: {
			email: body.email
		}
	});

	if (!user) {
		c.status(403);
		return c.json({ error: "user not found" });
	}

	const isValid = await bcrypt.compare(body.password, user.password);
	if (!isValid) {
		c.status(403);
		return c.json({ error: "invalid password" });
	}

	const jwt = await sign({ 
		id: user.id,
		iat : Math.floor(Date.now() / 1000), // issued at
		exp : Math.floor(Date.now() / 1000) + (60 * 60 * 24) // expires in 24 hours
	}, c.env.JWT_SECRET);
	return c.json({ jwt });
})

