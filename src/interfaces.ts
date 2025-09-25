export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: Date;
}

export interface PostWithUser extends Post {
  username: string;
  email: string;
}