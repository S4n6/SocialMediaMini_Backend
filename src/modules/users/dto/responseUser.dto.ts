export interface UserResponse {
  id: string;
  username?: string;
  email: string;
  fullname?: string;
  profilePicture?: string;
  gender?: string;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  role: string;
}
