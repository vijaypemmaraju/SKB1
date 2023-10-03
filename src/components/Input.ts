import { Types, defineComponent } from "bitecs";

const Input = defineComponent({
  direction: Types.ui8,
  lastDirection: Types.ui8,
});

export const Direction = {
  None: 0,
  Up: 1,
  Down: 2,
  Left: 4,
  Right: 8,
};

export default Input;
