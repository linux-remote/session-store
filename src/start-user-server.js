
const { genUserServerFlag } = require('./util');

const { START_FLAG, ERR_FLAG_START, ERR_FLAG_END } = genUserServerFlag();

// term server;
function startUserServer(term, newSidHash, username, callback) {

  let isEnd = false;
  let timer;
  function end(err) {
    if(timer){
      clearTimeout(timer);
    }
    if(isEnd) {
      return;
    }
    isEnd = true;
    if(err){
      term.kill();
      callback(err);
    } else {
      callback(null);
    }
  }

  const NODE_ENV = process.env.NODE_ENV || 'development';
  const cmd = `(NODE_ENV=${NODE_ENV} LR_SID_HASH=${newSidHash} ${process.argv[0]} ${global.CONF.userServerPath});exit`;

  term.write(cmd + '\n');
  let handleTermData = (data) => {
    if(data.indexOf(START_FLAG) !== -1) {
      term.removeListener('data', handleTermData);
      end(null);
    } else if(data.indexOf(ERR_FLAG_END) !== -1){
      end(new Error('[lr-user-server]: Start-up fail.' + _getErrMsg(data)));
    }
    // timeout ?
  }

  term.addListener('data', handleTermData);
  timer = setTimeout(function(){
    timer = null;
    end(new Error('[lr-user-server]: Start-up timeout.'));
  }, 5000);

}

function _getErrMsg(_str){
  let str = _str.substr(0, _str.indexOf(ERR_FLAG_END));
  let startIndex = str.indexOf(ERR_FLAG_START);
  if(startIndex !== -1){
    str = str.substr(startIndex + 1);
  }
  return str;
}

module.exports = startUserServer;
