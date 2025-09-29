# Development-platforms-ca

1. Clone Repo
git clone https://github.com/FransoArbela/development-platforms-ca.git
cd development-platforms-ca

2. Install dependencies
```bash
npm install
```

3. Environment variables
Create a .env file in the root folder.
```bash
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=mydatabase
PORT=3000
JWT_SECRET=yourSecretKey
```
4. Development mode
```bash
npm run dev
```

5. Build project
```bash
npm run build
```

6. Run production build
```bash
npm start
```

# Why i went with this option?
I was curious about the other side, since the day I started learning about APIs, and this was a great opportunity to take a dive and learn how things work under the hood. 

I would really like to do more things on the backend side, as this gives me a sense of full control over what I am doing and what I want to do when it comes to building things.

Things I particularly like were how much control I have and how I can decide what every request should do and what every response can be, at the same time, writing error responses made me understand how important it really is to write a clear and meaningful response when things don't go right. That was also one small, enjoyable part for me.

Also, deciding who can do what and who needs to verify themselves to do stuff like create and edit was also fun.

Things that were difficult were not any really, i just had to read the guides twice, so everything was fine.

The benefits of creating a custom API is obviously way more control, and you have exaclty what you need, no extra stuff, also the benefit of optimizing it further and further, depending on how and where you use it. Using SupaBase allows you to very quickly start your server side and have more focus on the front end, it is really nice how Supabase can handle most things for you.
