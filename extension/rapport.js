// node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i2 = 0; i2 < 31; ++i2) {
    b[i2] = start += 1 << eb[i2 - 1];
  }
  var r = new i32(b[30]);
  for (var i2 = 1; i2 < 30; ++i2) {
    for (var j = b[i2]; j < b[i2 + 1]; ++j) {
      r[j] = j - b[i2] << 5 | i2;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i2 = 0;
  var l = new u16(mb);
  for (; i2 < s; ++i2) {
    if (cd[i2])
      ++l[cd[i2] - 1];
  }
  var le = new u16(mb);
  for (i2 = 1; i2 < mb; ++i2) {
    le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        var sv = i2 << 4 | cd[i2];
        var r_1 = mb - cd[i2];
        var v = le[cd[i2] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i2 = 0; i2 < d.length; ++i2) {
    if (d[i2])
      t.push({ s: i2, f: d[i2] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i22 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i22].f ? i0++ : i22++];
    r = t[i0 != i1 && t[i0].f < t[i22].f ? i0++ : i22++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i2 = 1; i2 < s; ++i2) {
    if (t2[i2].s > maxSym)
      maxSym = t2[i2].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i2 = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i2 < s; ++i2) {
      var i2_1 = t2[i2].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i2].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i2;
    }
    for (; i2 >= 0 && dt; --i2) {
      var i2_3 = t2[i2].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i2 = 1; i2 <= s; ++i2) {
    if (c[i2] == cln && i2 != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i2];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i2 = 0; i2 < cl.length; ++i2)
    l += cf[i2] * cl[i2];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i2 = 0; i2 < s; ++i2)
    out[o + i2 + 4] = dat[i2];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i2 = 0; i2 < lclt.length; ++i2)
    ++lcfreq[lclt[i2] & 31];
  for (var i2 = 0; i2 < lcdt.length; ++i2)
    ++lcfreq[lcdt[i2] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i2 = 0; i2 < nlcc; ++i2)
      wbits(out, p + 3 * i2, lct[clim[i2]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i2 = 0; i2 < clct.length; ++i2) {
        var len = clct[i2] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i2] >> 5 & 127), p += clct[i2] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i2 = 0; i2 < li; ++i2) {
    var sym = syms[i2];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i3) {
      return (dat[i3] ^ dat[i3 + 1] << bs1_1 ^ dat[i3 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i2 = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i2 + 2 < s; ++i2) {
      var hv = hsh(i2);
      var imod = i2 & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i2) {
        var rem = s - i2;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i2 - bs, pos);
          li = lc_1 = eb = 0, bs = i2;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i2 - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i2);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i2 + l] == dat[i2 + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i2 + nl] == dat[i2 + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i2 - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i2 + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i2];
          ++lf[dat[i2]];
        }
      }
    }
    for (i2 = Math.max(i2, wi); i2 < s; ++i2) {
      syms[li++] = dat[i2];
      ++lf[dat[i2]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i2 - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i2, st.w = wi;
    }
  } else {
    for (var i2 = st.w || 0; i2 < s + lst; i2 += 65535) {
      var e = i2 + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i2, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ (function() {
  var t = new Int32Array(256);
  for (var i2 = 0; i2 < 256; ++i2) {
    var c = i2, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i2] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i2 = 0; i2 < d.length; ++i2)
        cr = crct[cr & 255 ^ d[i2]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
var fltn = function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (ArrayBuffer.isView(val))
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i2 = 0; i2 < str.length; ++i2)
      ar_1[i2] = str.charCodeAt(i2);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i2 = 0; i2 < l; ++i2) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i2 << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i2);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i2) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i2 = 0; i2 < files.length; ++i2) {
    var f = files[i2];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}

// src/stockage.js
var cle = (id) => `preuve:${id}`;
async function enregistrer(preuve) {
  await chrome.storage.local.set({ [cle(preuve.id)]: preuve });
}
async function lire(id) {
  const resultat = await chrome.storage.local.get(cle(id));
  return resultat[cle(id)] ?? null;
}
async function mettreAJour(id, champs) {
  const preuve = await lire(id);
  if (!preuve) return null;
  const nouvelle = { ...preuve, ...champs };
  await enregistrer(nouvelle);
  return nouvelle;
}
async function lister() {
  const tout = await chrome.storage.local.get(null);
  return Object.entries(tout).filter(([k]) => k.startsWith("preuve:")).map(([, v]) => v).sort((a, b) => b.numero - a.numero);
}
var ASSOCIATIONS_PAR_DEFAUT = ["accueil@mrap.fr", "ldh@ldh-france.org"];
async function lireAssociations() {
  const { associations = ASSOCIATIONS_PAR_DEFAUT } = await chrome.storage.local.get("associations");
  return associations;
}

// src/ui.js
function el(tag, attributs = {}, ...enfants) {
  const noeud = document.createElement(tag);
  for (const [nom, valeur] of Object.entries(attributs)) {
    if (valeur === void 0 || valeur === null || valeur === false) continue;
    if (nom.startsWith("on")) noeud.addEventListener(nom.slice(2), valeur);
    else if (nom === "class") noeud.className = valeur;
    else noeud.setAttribute(nom, valeur === true ? "" : valeur);
  }
  for (const enfant of enfants.flat()) {
    if (enfant === null || enfant === void 0 || enfant === false) continue;
    noeud.append(enfant instanceof Node ? enfant : String(enfant));
  }
  return noeud;
}
var VERDICTS = {
  probablement_illegal: { libelle: "Probablement ill\xE9gal", classe: "tampon--illegal" },
  limite: { libelle: "Limite", classe: "tampon--limite" },
  probablement_legal: { libelle: "Probablement l\xE9gal", classe: "tampon--legal" }
};
function libelleInfraction(i2) {
  const pays = { FR: "France", BE: "Belgique" }[i2.pays];
  return `${pays ? `${pays} : ` : ""}${i2.qualification}${i2.texte ? ` (${i2.texte})` : ""}`;
}
function tampon(preuve) {
  if (preuve.etatAnalyse === "en_cours") return el("span", { class: "tampon tampon--attente" }, "Analyse en cours\u2026");
  if (preuve.etatAnalyse === "echec") return el("span", { class: "tampon tampon--attente" }, "Analyse impossible");
  if (!preuve.analyse) return el("span", { class: "tampon tampon--attente" }, "\xC0 qualifier");
  const verdict = VERDICTS[preuve.analyse?.verdict];
  return verdict ? el("span", { class: `tampon ${verdict.classe}` }, verdict.libelle) : null;
}
function dateLocale(iso) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "medium" });
}
var nomFichier = (preuve, type) => `piece-${preuve.numero}-${type}.png`;
function texteDossier(preuves2) {
  return [
    `Dossier de signalement : ${preuves2.length} contenu(s) illicite(s) en ligne`,
    `Constitu\xE9 le ${dateLocale((/* @__PURE__ */ new Date()).toISOString())}`,
    "",
    ...preuves2.map((p) => `${"=".repeat(60)}
${texteSignalement(p)}
`)
  ].join("\n");
}
function texteSignalement(preuve) {
  const infractions = preuve.analyse?.infractions ?? [];
  return [
    `Pi\xE8ce n\xB0${preuve.numero}`,
    "",
    `Date de constatation : ${dateLocale(preuve.horodatage)} (UTC : ${preuve.horodatage})`,
    `Page : ${preuve.url}`,
    preuve.lienCommentaire ? `Lien direct du commentaire : ${preuve.lienCommentaire}` : null,
    `Auteur pr\xE9sum\xE9 : ${preuve.auteur || "non identifi\xE9"}`,
    "",
    ...preuve.publication ? ["Publication comment\xE9e :", preuve.publication, ""] : [],
    "Contenu publi\xE9 :",
    `\xAB ${preuve.texte} \xBB`,
    "",
    ...infractions.length > 0 ? [
      "Qualification envisag\xE9e :",
      ...infractions.map((i2) => `- ${libelleInfraction(i2)}`),
      ...preuve.analyse.explication ? ["", preuve.analyse.explication] : [],
      ""
    ] : [],
    "Captures (zones identifiant l'auteur du signalement masqu\xE9es en noir) :",
    `- ${nomFichier(preuve, "commentaire")} (SHA-256 : ${preuve.sha256})`,
    preuve.capturePublication ? `- ${nomFichier(preuve, "publication")} (SHA-256 : ${preuve.sha256Publication})` : null
  ].filter((ligne) => ligne !== null).join("\n");
}

// src/rapport.js
var etapes = document.getElementById("etapes");
var outils = document.getElementById("outils");
var rapport = document.getElementById("rapport");
var preuves = (await lister()).filter((p) => p.statut === "valide").sort((a, b) => a.numero - b.numero);
var aujourdhui = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var nomZip = `dossier-signalement-${aujourdhui}.zip`;
var extrait = (texte, max = 100) => texte.length > max ? `${texte.slice(0, max).trim()}\u2026` : texte;
function telechargerZip() {
  const fichiers = { "dossier.txt": strToU8(texteDossier(preuves)) };
  const octets = (dataUrl) => Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
  for (const p of preuves) {
    fichiers[nomFichier(p, "commentaire")] = octets(p.capture);
    if (p.capturePublication) fichiers[nomFichier(p, "publication")] = octets(p.capturePublication);
  }
  const lien = el("a", { href: URL.createObjectURL(new Blob([zipSync(fichiers)], { type: "application/zip" })), download: nomZip });
  lien.click();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1e3);
}
function liensMail(associations) {
  const sujet = `Signalement de ${preuves.length} contenu(s) haineux en ligne`;
  const resume = preuves.slice(0, 15).flatMap((p) => [
    `- Pi\xE8ce n\xB0${p.numero} : ${p.auteur || "auteur non identifi\xE9"}, \xAB ${extrait(p.texte)} \xBB (${VERDICTS[p.analyse?.verdict]?.libelle ?? "non analys\xE9e"})`,
    `  ${p.lienCommentaire || p.url}`
  ]);
  if (preuves.length > 15) resume.push(`- \u2026 et ${preuves.length - 15} autre(s), d\xE9taill\xE9e(s) dans le dossier joint.`);
  const corps = [
    "Bonjour,",
    "",
    `Je vous transmets un dossier de ${preuves.length} contenu(s) publi\xE9(s) en ligne qui me semblent relever de la haine raciale ou religieuse, ou de l'apologie de crimes contre l'humanit\xE9. Le dossier complet (captures d'\xE9cran, empreintes SHA-256, liens et qualification envisag\xE9e) est joint au format ZIP (${nomZip}).`,
    "",
    "R\xE9sum\xE9 :",
    ...resume,
    "",
    "Je reste \xE0 votre disposition pour tout compl\xE9ment.",
    "",
    "Cordialement,"
  ].join("\n");
  const bcc = associations.join(",");
  const gmail = new URL("https://mail.google.com/mail/");
  gmail.search = new URLSearchParams({ view: "cm", fs: "1", bcc, su: sujet, body: corps }).toString();
  const mailto = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  return { gmail: gmail.href, mailto };
}
function etape(titre, texte, ...actions) {
  return el("li", {}, el("strong", {}, titre), el("p", {}, texte), el("div", { class: "actions" }, ...actions));
}
function section(preuve) {
  const analyse = preuve.analyse;
  return el(
    "section",
    { class: "piece-rapport" },
    el("div", { class: "entete" }, el("h2", {}, `Pi\xE8ce n\xB0${preuve.numero}`), tampon(preuve)),
    el(
      "dl",
      { class: "meta" },
      el("dt", {}, "Date"),
      el("dd", {}, `${dateLocale(preuve.horodatage)} (UTC : ${preuve.horodatage})`),
      el("dt", {}, "Page"),
      el("dd", {}, preuve.url),
      preuve.lienCommentaire && el("dt", {}, "Commentaire"),
      preuve.lienCommentaire && el("dd", {}, preuve.lienCommentaire),
      el("dt", {}, "Auteur pr\xE9sum\xE9"),
      el("dd", {}, preuve.auteur || "Non identifi\xE9")
    ),
    preuve.publication && el("h3", {}, "Publication comment\xE9e"),
    preuve.publication && el("p", { class: "publication" }, preuve.publication),
    el("h3", {}, "Contenu signal\xE9"),
    el("blockquote", {}, preuve.texte),
    analyse && el("h3", {}, "Qualification envisag\xE9e"),
    analyse && (analyse.infractions.length > 0 ? el("ul", {}, analyse.infractions.map((i2) => el("li", {}, libelleInfraction(i2)))) : el("p", {}, "Aucune infraction pr\xE9cis\xE9e.")),
    analyse && el("p", {}, analyse.explication),
    preuve.capturePublication && el("h3", {}, "Capture de la publication"),
    preuve.capturePublication && el("img", { src: preuve.capturePublication, alt: `Publication comment\xE9e, pi\xE8ce n\xB0${preuve.numero}` }),
    preuve.capturePublication && el("p", { class: "source" }, `${nomFichier(preuve, "publication")}, SHA-256 : ${preuve.sha256Publication}`),
    el("h3", {}, "Capture du commentaire"),
    el("img", { src: preuve.capture, alt: `Commentaire signal\xE9, pi\xE8ce n\xB0${preuve.numero}` }),
    el("p", { class: "source" }, `${nomFichier(preuve, "commentaire")}, SHA-256 : ${preuve.sha256}`),
    (preuve.commentairesVoisins ?? []).length > 0 && el("h3", {}, "Autres commentaires visibles au moment de la capture"),
    (preuve.commentairesVoisins ?? []).length > 0 && el("ul", {}, preuve.commentairesVoisins.map((v) => el("li", {}, `${v.auteur || "Auteur inconnu"} : ${v.texte.replace(/\s+/g, " ")}`)))
  );
}
if (preuves.length === 0) {
  rapport.replaceChildren(el("p", {}, "Aucune pi\xE8ce valid\xE9e. Ajoute des pi\xE8ces au dossier depuis l'onglet \xAB \xC0 examiner \xBB."));
} else {
  document.title = `Dossier de signalement (${preuves.length})`;
  const associations = await lireAssociations();
  const mail = liensMail(associations);
  const confirmation = el("p", { class: "confirmation", role: "status" });
  const boutonsClore = [];
  const boutonClore = (classe) => {
    const bouton = el("button", { class: `bouton ${classe}`, type: "button", onclick: clore }, "Clore le dossier");
    boutonsClore.push(bouton);
    return bouton;
  };
  async function clore() {
    const dateEnvoi = (/* @__PURE__ */ new Date()).toISOString();
    for (const p of preuves) await mettreAJour(p.id, { statut: "envoye", dateEnvoi });
    for (const b of boutonsClore) b.disabled = true;
    const message = `Dossier clos : ${preuves.length} pi\xE8ce(s) rang\xE9e(s) dans \xAB Envoy\xE9e \xBB.`;
    confirmation.textContent = message;
    bandeau.replaceChildren(el("p", {}, message), el("a", { class: "bouton", href: "dossier.html" }, "Retour au dossier de preuves"));
  }
  const bandeau = el(
    "div",
    { class: "bandeau", hidden: true, role: "region", "aria-label": "Cl\xF4ture du dossier" },
    el("p", {}, "Mail envoy\xE9 ? Clos le dossier pour repartir d'un dossier vide."),
    boutonClore("bouton--plein")
  );
  document.body.append(bandeau);
  const afficherBandeau = () => bandeau.removeAttribute("hidden");
  etapes.replaceChildren(
    etape("T\xE9l\xE9charger le dossier", `Un seul fichier ZIP : le r\xE9capitulatif texte et les ${preuves.length * 2} captures au plus.`, el("button", { class: "bouton bouton--plein", type: "button", onclick: telechargerZip }, "T\xE9l\xE9charger le ZIP")),
    etape(
      "Envoyer un seul mail",
      associations.length > 0 ? `Le brouillon s'ouvre avec ${associations.length} association(s) en copie cach\xE9e. Joins le ZIP, relis, puis clique sur \xAB Envoyer \xBB.` : "Aucune association enregistr\xE9e : ajoute leurs adresses dans les options.",
      associations.length > 0 ? [
        el("a", { class: "bouton bouton--plein", href: mail.gmail, target: "_blank", rel: "noreferrer", title: `CCI : ${associations.join(", ")}`, onclick: afficherBandeau }, "Ouvrir le brouillon Gmail"),
        el("a", { class: "bouton", href: mail.mailto, onclick: afficherBandeau }, "Autre messagerie")
      ] : el("a", { class: "bouton", href: "options.html" }, "Ouvrir les options")
    ),
    etape(
      "Clore le dossier",
      "Une fois le mail parti, range ces pi\xE8ces dans \xAB Envoy\xE9e \xBB pour repartir d'un dossier vide.",
      boutonClore(""),
      confirmation
    )
  );
  const boutonCopier = el(
    "button",
    {
      class: "bouton",
      type: "button",
      onclick: async () => {
        await navigator.clipboard.writeText(texteDossier(preuves));
        boutonCopier.textContent = "Texte copi\xE9";
      }
    },
    "Copier le texte du dossier"
  );
  outils.replaceChildren(
    boutonCopier,
    el("a", { class: "bouton", href: "https://www.internet-signalement.gouv.fr", target: "_blank", rel: "noreferrer" }, "Signaler sur Pharos (France)"),
    el("a", { class: "bouton", href: "https://www.unia.be", target: "_blank", rel: "noreferrer" }, "Signaler \xE0 Unia (Belgique)"),
    el("button", { class: "bouton", type: "button", onclick: () => print() }, "Imprimer ou enregistrer en PDF")
  );
  rapport.replaceChildren(
    el("h1", {}, "Dossier de signalement"),
    el("p", { class: "intro" }, `${preuves.length} contenu(s), constitu\xE9 le ${dateLocale((/* @__PURE__ */ new Date()).toISOString())}. Les zones qui identifient l'auteur du signalement sont masqu\xE9es en noir sur les captures.`),
    ...preuves.map(section)
  );
}
