import { Html, Button } from "@react-email/components";

export function TestEmailComponent(props) {

  return (
    <Html lang="en">
      <Button href={props.url}>Click me</Button>
    </Html>
  );
}
