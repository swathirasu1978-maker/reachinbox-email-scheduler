import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./config/prisma";
import { env } from "./config/env";

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.GOOGLE_CALLBACK_URL
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error("Google account has no email"));

      const user = await prisma.user.upsert({
        where: { email },
        update: {
          googleId: profile.id,
          name: profile.displayName || email,
          avatarUrl: profile.photos?.[0]?.value
        },
        create: {
          googleId: profile.id,
          email,
          name: profile.displayName || email,
          avatarUrl: profile.photos?.[0]?.value
        }
      });
      done(null, user);
    } catch (e) {
      done(e as Error);
    }
  }));
}
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    done(null, user || false);
  } catch (error) {
    done(error);
  }
});
export default passport;
