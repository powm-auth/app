import { Redirect } from 'expo-router';
import React from 'react';

export default function IndexRedirect() {
  // Root `/` should bring users to the startup flow
  return <Redirect href="/startup" />;
}