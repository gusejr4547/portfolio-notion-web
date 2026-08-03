function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Starter Kit. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export { Footer };
