import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { sendMail } from "./mailer";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false, // impede o usuário de definir o próprio role no cadastro
      },
    },
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const subject =
          type === "sign-in"
            ? "Seu código de acesso"
            : type === "email-verification"
              ? "Confirme seu email"
              : "Redefinição de senha";

        await sendMail({
          to: email,
          subject,
          html: `<p>Seu código é <strong>${otp}</strong>. Ele expira em 5 minutos.</p>`,
        });
      },
      otpLength: 6,
      expiresIn: 300,
    }),
    nextCookies(), // sempre por último
  ],
});
