import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_should_be_changed', {
    expiresIn: '30d',
  });
};

export default generateToken;