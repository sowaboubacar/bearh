import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind
} from "@react-email/components";

interface ResetPINEmailProps {
  username: string;
  resetUrl: string;
}

export function ResetPINEmail({ resetUrl, username = "" }: ResetPINEmailProps) {
  return (
    <Html>
      <Head>
        <style>
          {`
            @media (min-width: 640px) {
              .sm-px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
              .sm-px-12 { padding-left: 3rem; padding-right: 3rem; }
              .sm-py-16 { padding-top: 4rem; padding-bottom: 4rem; }
            }
            @media (min-width: 1024px) {
              .lg-px-8 { padding-left: 2rem; padding-right: 2rem; }
            }
            .button-shadow {
              box-shadow: 0 4px 6px rgba(0, 120, 125, 0.25), 0 10px 15px rgba(0, 120, 125, 0.1);
            }
            .button-shadow:hover {
              box-shadow: 0 6px 8px rgba(0, 120, 125, 0.3), 0 12px 18px rgba(0, 120, 125, 0.15);
            }
          `}
        </style>
      </Head>
      <Preview>Réinitialisation de votre code PIN Val d&apos;Oise RH</Preview>
      <Tailwind>
        <Body className="bg-[#f0f4f8] font-sans">
          <Container className="mx-auto py-20">
            <Section className="w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
              <Section className="bg-gradient-to-r from-[#00787d] to-[#005c61] p-10">
                <Img
                  src="https://rh.pharmacievaldoise.com/img/logo-rect-white.png"
                  width="220"
                  height="66"
                  alt="Val d&apos;Oise RH"
                  className="mx-auto"
                />
              </Section>
              
              <Section className="px-10 py-12 sm-px-12 sm-py-16 m-4">
                <Heading className="text-[#1a1a1a] text-3xl font-bold mb-8 text-center">
                  Réinitialisation de code PIN
                </Heading>
                
                <Text className="text-[#4a5568] text-lg leading-relaxed mb-6">
                  Bonjour <span className="font-semibold text-[#00787d]">{username}</span>,
                </Text>
                
                <Text className="text-[#4a5568] text-lg leading-relaxed mb-8">
                  Nous avons reçu une demande de réinitialisation de code PIN pour votre compte Val d&apos;Oise RH. 
                  Si vous n&apos;avez pas fait cette demande, veuillez ignorer cet e-mail et contacter immédiatement notre équipe de sécurité.
                </Text>
                
                <Section className="text-center mb-10">
                  <Button
                    pX={16}
                    pY={4}
                    className="bg-[#00787d] hover:bg-[#005c61] rounded-lg text-white text-xl font-bold no-underline inline-block button-shadow transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1"
                    href={resetUrl}
                  >
                    Réinitialiser le code PIN
                  </Button>
                </Section>
                
                <Text className="text-[#4a5568] text-lg leading-relaxed mb-6">
                  Ce lien expirera dans 15 Minutes pour des raisons de sécurité. Si vous avez besoin d&apos;un nouveau lien après ce délai, 
                  veuillez refaire une demande de réinitialisation.
                </Text>
                
                <Text className="text-[#4a5568] text-lg leading-relaxed mb-6">
                  Pour votre sécurité, nous vous recommandons de choisir un code PIN unique et difficile à deviner. 
                  N'utilisez pas de séquences évidentes comme votre date de naissance.
                </Text>
                
                <Text className="text-[#4a5568] text-lg leading-relaxed mb-10">
                  Si vous rencontrez des difficultés ou si vous n&apos;avez pas demandé cette réinitialisation, 
                  veuillez contacter notre service d&apos;assistance immédiatement.
                </Text>
                
                <Hr className="border-[#e2e8f0] my-8" />
                
                <Text className="text-[#a0aec0] text-base text-center">
                  Val d&apos;Oise RH - By Selys-Africa
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default ResetPINEmail;