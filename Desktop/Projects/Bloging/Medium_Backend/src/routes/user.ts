import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { jwt , sign,verify } from 'hono/jwt';


export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
      };
      Variables: {
        userId: string; 
      };
}>();


// app.use('/api/v1/blog/*', async (c, next) => {
//     const authHeader = c.req.header('Authorization');
//     if (!authHeader) {
//       c.status(401);
//       return c.json({ error: "unauthorized" });
//     }
  
//     const token = authHeader.split(' ')[1];
//     const payload = await verify(token, c.env.JWT_SECRET);
//     if (!payload) {
//       c.status(401);
//       return c.json({ error: "unauthorized" });
//     }
  
//     c.set('userId', payload.id); // ✅ Corrected way to set userId
//     await next();
//   });
  
  
//   app.get('/', async (c) => {
//     return c.text('Hello Hono!')
//   })
  userRouter.post('/signup', async (c)=>{
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  try {
    
    const body =  await c.req.json();
   const user =  await prisma.user.create({
      data:{
        email : body.email,
        password : body.password
        
      },
    })
    const token =  await sign({id : user.id},c.env.JWT_SECRET)
    return c.json({
      jwt : token
    })
  } catch (error) {
    console.log(error);
  }
    
  })
  userRouter.post('/signin', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const user = await prisma.user.findUnique({
		where: {
			email: body.email,
      password : body.password
		} 
	});

	if (!user) {
		c.status(403);
		return c.json({ error: "user not found" });
	}

	const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
	return c.json({ jwt });
})