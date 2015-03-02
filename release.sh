#!/bin/sh
ver=`perl -ne 'print "$1" if /^docname:.*([0-9]{2})$/' < draft-hildebrand-spud-prototype.md`
for typ in html xml txt; do
  cp output/draft-hildebrand-spud-prototype.$typ releases/draft-hildebrand-spud-prototype-$ver.$typ
done
