// Function copied from sugarbot firebaseUtils. TODO: unify
//
function subSlashes( str ) {
  if (str) {
    return str.replace(/[\/\.$#\[\]]/g, '_');
  }
  return ''
}
