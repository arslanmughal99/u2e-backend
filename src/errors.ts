export const ERROR_CODES_TOKEN = 'ERROR_CODES';

const codes = {
  FILE_NAME_REQUIRED: 'FILE_NAME_REQUIRED', // Upload file name is required
  SOMETHING_WENT_WRONG: 'SOMETHING_WENT_WRONG', // Something went wrong
};

export type ErrorCodes = typeof codes;

export default codes;
