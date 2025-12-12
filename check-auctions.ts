import { prisma } from './lib/prisma';

async function checkData() {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        assets: true,
        _count: { select: { assets: true } },
      },
      take: 5,
    });

    console.log('Auctions with assets:');
    auctions.forEach(a => {
      console.log(`Auction ${a.id}: ${a.assets.length} assets`);
      a.assets.forEach(asset => console.log(`  ${asset.type}: ${asset.url.substring(0, 50)}...`));
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

checkData();