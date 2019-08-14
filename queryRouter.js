"use strict";

const HttpError = require("http-error-prototype");

const SCORES = {
  FULL_STRICT: 4,
  PARTIAL_STRICT: 3,
  NON_STRICT: 2,
  DEFAULT: 1,
  NO_MATCH: 0
};

function scoreMapping(mapping, req) {
  let strict = true;

  if (!mapping.query || Object.keys(mapping.query).length === 0)
    return {
      match: mapping.default ? SCORES.DEFAULT : SCORES.NO_MATCH,
      params: 0
    };

  let params = 0;
  for (let q in mapping.query) {
    let value = mapping.query[q];
    if (req.query[q] === value) {
      ++params;
      continue;
    }
    else if (req.query[q]) {
      strict = false;
      ++params;
      continue;
    }
    else {
      return {
        match: mapping.default ? SCORES.DEFAULT : SCORES.NO_MATCH,
        params: 0
      };
    }
  }

  let match;
  if (strict) {
    match = Object.keys(mapping.query).length === Object.keys(req.query).length ? SCORES.FULL_STRICT : SCORES.PARTIAL_STRICT;
  }
  else {
    match = SCORES.NON_STRICT;
  }

  return {
    match: match,
    params: params
  };
}

module.exports = function queryRouter(mappings, options = {}) {
  return async function middleware(req, res, next) {
    try {
      let highestScore = {
        match: SCORES.NO_MATCH,
        params: 0
      };

      let highestScoreMapping;
      for (let m of mappings) {
        let score = scoreMapping(m, req);
        if (score.match > highestScore.match || (score.match === highestScore.match && score.params > highestScore.params)) {
          highestScore = score;
          highestScoreMapping = m;
        }
      }

      if (highestScoreMapping) {
        if (highestScoreMapping.middlewares) {
          for (let m of highestScoreMapping.middlewares) {
            try {
              await new Promise((resolve, reject) => {
                m(req, res, (err) => {
                  if (err)
                    return reject(err);

                  resolve();
                });
              });
            }
            catch (err) {
              return next(err);
            }
          }
        }

        return await highestScoreMapping.handler(req, res, next);
      }

      if (options.notFound) {
        if (typeof options.notFound === "function")
          throw options.notFound();
        else
          throw options.notFound;
      }
      else {
        throw HttpError.notFound();
      }
    }
    catch (err) {
      next(err);
    }
  };
};

