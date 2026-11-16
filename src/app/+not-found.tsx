import { Redirect } from 'expo-router';

/** Unknown routes go back to Train. Never renders anything privileged. */
export default function NotFound() {
  return <Redirect href="/" />;
}
