import { defineComponent, Types } from "bitecs";

const Pushable = defineComponent({
  distanceFromPlayerX: Types.f32,
  distanceFromPlayerY: Types.f32,
});

export default Pushable;
