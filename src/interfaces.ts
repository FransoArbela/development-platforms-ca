export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
}
export interface UserResponse {
  id: number;
  username: string;
  email: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  submitted_by: number;
  created_at: Date;
  category?: string;

}
