import { redirect } from 'next/navigation';

export default function AdminTournamentsRedirectPage() {
  redirect('/admin/tournaments/async');
}
