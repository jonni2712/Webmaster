import { redirect } from 'next/navigation';

export default async function Home() {
  // TODO: Riabilitare controllo sessione quando OAuth è pronto
  redirect('/dashboard');
}
