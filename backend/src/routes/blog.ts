import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs';
import { createBlogInput, updateBlogInput } from '@aditya.sharma._/medium-common';

type HonoEnv = {
    DATABASE_URL: string,
    JWT_SECRET: string,
}

type HonoVariables = {
    userId: string;
}

export const blogRouter = new Hono<{ Bindings: HonoEnv, Variables: HonoVariables }>();

blogRouter.use('/*', async (c, next) => {
    
    const token: string = c.req.header('Authorization')?.split(' ')[1] || '';
    try{
    const payload = await verify(token, c.env.JWT_SECRET);
        if (payload) {
            c.set('userId', String(payload.id));
            await next();
        }    
    } catch (error) {
        c.status(401);
        return c.json({ error: "Unauthorized" });
    }
});


//TOdo: Add Pagination
blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());;
    const blogs = await prisma.post.findMany();
    return c.json({blogs});
})

blogRouter.get('/:id', async (c) => {
	const id = c.req.param('id');

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
            const blog = await prisma.post.findFirst({
            where: { 
                id: id
            },
        })
        return c.json(blog);  
    } catch (error) {
        c.status(500)
        return c.json({ message: 'Internal Server Error' });
    }
})

blogRouter.post('/', async (c) => {

    const body = await c.req.json();
    if (!createBlogInput.safeParse(body).success) {
        c.status(400);
        return c.json({ error: "Invalid input" });
    }

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const userId = c.get('userId');
    const blog = await prisma.post.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: userId,
        }

    });
    return c.json({ id : blog.id });
})

blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    if (!updateBlogInput.safeParse(body).success) {
        c.status(400);
        return c.json({ error: "Invalid input" });
    }
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const userId = c.get('userId');
    const blog = await prisma.post.update({
        where: { id: body.id },
        data: {
            title: body.title,
            content: body.content,
            authorId: userId,
        }
    });
    return c.json({ id: blog.id });
})

