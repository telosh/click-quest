declare module "undraw-react/dist/esm/illustrations/*.js" {
  import type { CSSProperties, FC } from "react";

  interface UndrawProps {
    color?: string;
    size?: number | string;
    style?: CSSProperties;
  }

  const Illustration: FC<UndrawProps>;
  export default Illustration;
}
