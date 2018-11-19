const pgPromise = require('pg-promise');
const R         = require('ramda');
const request   = require('request-promise');
const argv = require('minimist')(process.argv.slice(2));
// Limit the amount of debugging of SQL expressions
const trimLogsSize : number = 200;

// Database interface
interface DBOptions
  { host      : string
  , database  : string
  , user?     : string
  , password? : string
  , port?     : number
  };

// Actual database options
const options : DBOptions = {
  user: 'postgres',
  password: 'mozcatel1993' ,
  host: 'localhost',
  port: 5432,
  database: 'lovelystay_test',
};

console.info('Connecting to the database:',
  `${options.user}@${options.host}:${options.port}/${options.database}`);

const pgpDefaultConfig = {
  promiseLib: require('bluebird'),
  // Log all querys
  query(query) {
    console.log('[SQL   ]', R.take(trimLogsSize,query.query));
  },
  // On error, please show me the SQL
  error(err, e) {
    if (e.query) {
      console.error('[SQL   ]', R.take(trimLogsSize,e.query),err);
    }
  }
};

interface GithubUsers
  { 
    id : number,
    name : string,
    company : string
  };

const pgp = pgPromise(pgpDefaultConfig);
const db = pgp(options);
const user = argv['u'] || argv['user'];

db.none('CREATE TABLE IF NOT EXISTS github_users (id BIGSERIAL, login TEXT, name TEXT, company TEXT)')
.then(() => request({
  uri: 'https://api.github.com/users/' + user,
  headers: {
        'User-Agent': 'Request-Promise'
    },
  json: true
}))
.then((data: GithubUsers) => db.one(
  'INSERT INTO github_users (login) VALUES ($[login]) RETURNING id', data)
).then(({id}) => console.log(id))
.then(() => process.exit(0));
