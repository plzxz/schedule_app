import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/menu');
  // return (
  //   <main className="flex items-center justify-center h-screen bg-gray-800">
  //     <h1 className="text-white text-4xl font-bold">My Schedule (coming soon)</h1>
  //   </main>
  // );
}