export const shortenAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-6)}`;

export const formatTimeslot = (hour: number) =>
  hour < 13 ? `${hour}am` : `${hour - 12}pm`;
