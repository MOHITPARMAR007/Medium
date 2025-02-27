import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { decode, verify } from "hono/jwt";

export const blogRouter = new  Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
      };
      Variables: {
        jwtPayload: string
      }
}>()
// blogRouter.use("/*", async (c, next) => {
//     const jwt = c.req.header("Authorization")|| " ";
//     if (!jwt) return c.json({ error: "Unauthorized" }, 401);
  
//     try {
//       const token = jwt.split(" ")[1];
//       const payload = await verify(token, c.env.JWT_SECRET);
//       console.log("Extracted userId from JWT:", payload.id);
//       if (!payload) return c.json({ error: "Unauthorized" }, 401);
//       c.set('userId',payload.id)
//       await next();
//     } catch (err) {
//       return c.json({ error: "Invalid token" }, 401);
//     }
//   });

blogRouter.use('/*', async (c, next) => { 
    try {
      const authHeader = c.req.header('Authorization') || " ";
      //console.log(authHeader,"geting auth heder");
      
     const response = await verify(authHeader, c.env.JWT_SECRET);
     //console.log(response);
     
      if (response) {
        c.set('jwtPayload', response.id );
        await next();
      }
    } catch (error) {
      // console.error(error);
      c.status(403);
      return c.json({ message: 'UnAuthorized' });
    }
  }); 
  

  blogRouter.post("/", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const authorId = c.get('jwtPayload'); 
    console.log(authorId)// Extract user ID from JWT

    try {
        // 🔹 Check if the user exists
        const user = await prisma.user.findUnique({
            where: { id: authorId },
        });

        if (!user) {
            return c.json({ error: "User does not exist" }, 400);
        }

        // 🔹 Now create the post
        const response = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: authorId, // Must be a valid string UUID
            },
        });

        return c.json({ id: response.id }, 201);
    } catch (error) {
        console.error("Error creating post:", error);
        return c.json({ error: "Failed to create post", details: (error as any).message }, 500);
    }
});




blogRouter.put('/',async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json();
    try {
        const resposne = await prisma.post.update({
            where : {id : body.id},
            data : {
                title : body.title,
                content :body.content ,
            }
        })
        return c.json({
            id : resposne.id
        })
        
    } catch (err) {
        console.log(err);
        
    }

})

blogRouter.get('/' , async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json();
    try {
        const resposne = await prisma.post.findUnique({
            where : {id : body.id},
            
        })
        return c.json({
            resposne
        })
        
    } catch (err) {
        console.log(err);
        
    }
})

blogRouter.get('/bulk' , async (c) =>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())


    try {
    const resposne = await prisma.post.findMany();
        return c.json({
            resposne
        })
    } catch (error) {
        console.log(error);
        
    }
    return c.text('hello hono')
})