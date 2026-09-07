import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | BoredFlix',
  description: 'Get in touch with the BoredFlix team for support and feedback.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
