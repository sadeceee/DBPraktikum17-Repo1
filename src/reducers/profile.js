
const initialState = {
  int: ""
};

export default function statistics(state = initialState, action = {}) {
  switch (action.type) {
    case "STATISTICS":
      return { ...state, int: action.payload};
    default:
      return state
  }
}
