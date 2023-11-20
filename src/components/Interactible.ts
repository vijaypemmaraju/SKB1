import { Types, defineComponent } from "bitecs";

export const InteractibleType = {
  Pushable: 1,
};

const Interactible = defineComponent({
  cursor: Types.eid,
  interacting: Types.i8,
  type: Types.ui8,
});

export default Interactible;
