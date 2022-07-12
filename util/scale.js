function scale(realX, referX, referY, slope = 1) {
 // (realY - realX) / (realX - referX) = slope
 return (slope * (realX - referX)) + referY
}

module.exports = scale