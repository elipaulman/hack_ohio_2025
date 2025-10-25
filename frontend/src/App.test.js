import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the sample title', () => {
  render(<App />);
  const title = screen.getByText(/Loremipsum Title/i);
  expect(title).toBeInTheDocument();
});
