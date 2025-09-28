# development-platforms-ca

1. Clone Repo
git clone https://github.com/FransoArbela/development-platforms-ca.git
cd development-platforms-ca

2. Install dependencies
```bash
npm install
```

3. Environment variables
Create a .env file in the root folder. Example (.env.example would be great to include in your repo):
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