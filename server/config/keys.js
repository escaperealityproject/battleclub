// dev and prod keys must be different
// production should not touch actual users data
// actual data must remain pristine

if (process.env.NODE_ENV === 'production') {
  // return prod keys
  module.exports = require('./prod');
} else {
  // return dev keys
  module.exports = require('./dev');
}
