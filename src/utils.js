export const generateUniqueID = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength = characters.length;
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const getInitials = (str) => {
  const words = str.trim().split(" ");

  const initials =
    words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0][0];

  return initials;
};
