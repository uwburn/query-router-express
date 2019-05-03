"use strict";

const HttpError = require("http-error");

const SCORES = {
  STRICT: 3,
  NON_STRICT: 2,
  DEFAULT: 1,
  NO_MATCH: 0
};

function scoreMapping(mapping, req) {
  let strict = true;

  for (let q in mapping.query) {
    let value = mapping.query[q];
    if (req.query[q] === value) {
      continue;
    }
    else if (req.query[q]) {
      strict = false;
      continue;
    }
    else {
      return mapping.default ? SCORES.DEFAULT : SCORES.NO_MATCH;
    }
  }

  return strict ? SCORES.STRICT : SCORES.NON_STRICT;
}

module.exports = function queryRouter(mappings, options) {
  return async function middleware(req, res, next) {
    try {
      let highestScore = SCORES.NO_MATCH;
      let highestScoreHanlder;
      for (let m of mappings) {
        let score = scoreMapping(m, req);
        if (score === SCORES.STRICT)
          return await m.handler(req, res, next);
        if (score > highestScore)
          highestScoreHanlder = m.handler;
      }

      if (highestScoreHanlder)
        return await highestScoreHanlder(req, res, next);

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
    catch(err) {
      next(err);
    }
  };
};
