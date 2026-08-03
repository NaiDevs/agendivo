interface FieldErrorProps {
  message: string | undefined;
}

export function FieldError({ message }: FieldErrorProps) {
  if (message === undefined) {
    return null;
  }

  return (
    <p className="text-destructive text-sm" role="alert">
      {message}
    </p>
  );
}
