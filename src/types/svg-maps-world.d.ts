declare module '@svg-maps/world' {
  const map: {
    viewBox: string;
    label: string;
    locations: { id: string; name: string; path: string }[];
  };
  export default map;
}
