#!/usr/bin/env python3
import sys
import argparse
import hashlib
import getpass
import struct

PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
DIGITS = '0123456789'
ENCODING = ''.join((UPPERCASE, LOWERCASE, DIGITS))


########################################################################
def main():
    args = parse_args()

    password = getpass.getpass()
    salt = '|'.join((args.site, args.username))

    for attempt in [str(i) for i in range(2)]:
        key = '|'.join((password, args.master_salt, args.salt, attempt))
        hashed = hashlib.pbkdf2_hmac('sha512', key.encode('utf-8'), salt.encode('utf-8'), 2**args.iterations)
        if (not hashed is None):
            print(key)
            print(salt)
            print(args.iterations)
            print(encode(hashed, 16))
            break
    else:
        print("Failed generating password")
    
    



########################################################################
def parse_args():
    parser = argparse.ArgumentParser(description="Generate site passwords using PBKDF2.")
    parser.add_argument('-i', '--iterations', type=int, metavar='<int>', default=20,
                        help="Log2 of the number of PBKDF2 iterations." )
    parser.add_argument('-m', '--master-salt', type=str, metavar='<str>', default='',
                        help="Master salt.")
    parser.add_argument('-s', '--salt', type=str, metavar='<str>', default='',
                        help="Site salt.")
    parser.add_argument('-u', '--username', type=str, metavar='<str>', default='',
                        help="Username.")
    parser.add_argument('-w', '--site', type=str, metavar='<str>', default='',
                        help="Site address (e.g. www.example.com).")

    return parser.parse_args()


########################################################################
def encode_uld(num):
    digit = DIGITS[num % 10]
    num //= 10

    lower = LOWERCASE[num % 26]
    num //= 26

    upper = UPPERCASE[num % 26]
    num //= 26

    p = PERMS[num % 6]

    result = [''] * 3
    result[p[0]] = upper
    result[p[1]] = lower
    result[p[2]] = digit

    return ''.join(result)


########################################################################

########################################################################
def encode(raw, nchars):
    def encode_word(word):
        if (word >= 65534):
            return ''
        return ENCODING[word % 62]

    if (len(raw) % 2):
        raw = raw[:-1]

    nwords = len(raw) // 2
    unpacked = struct.unpack('@' + nwords*'H', raw)
    result = [encode_uld(unpacked[0])] + [encode_word(w) for w in unpacked[1:]]
    result = ''.join(result)

    if (len(result) < nchars):
        return None
    
    return result[:nchars]


########################################################################
if __name__ == '__main__':
    sys.exit(main())