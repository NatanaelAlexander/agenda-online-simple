export interface BookingSessionPayload {
  type: 'booking';
  jti: string;
  email: string;
  name: string;
  googleSub: string;
  picture?: string;
}

export interface BookingSessionRecord {
  email: string;
  name: string;
  googleSub: string;
  picture?: string;
  used: boolean;
  createdAt: string;
}

export interface BookingSessionIssueResult {
  bookingToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  client: {
    email: string;
    name: string;
    picture?: string;
  };
}
