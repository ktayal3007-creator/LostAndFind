-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Create new trigger for immediate sync on signup (since email verification is disabled)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();