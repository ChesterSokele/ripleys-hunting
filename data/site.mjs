// Ripley Safaris — business facts. Everything here was carried over verbatim from the original website.
// Edit this file (not the generated HTML) to change packages, rates, inclusions or contact details,
// then run `npm run pages`.

export const business = {
  name: 'Ripley Safaris',
  phone: '+27 71 858 4498',
  phoneHref: 'tel:+27718584498',
  email: 'ripleysafaris@gmail.com',
  whatsapp: 'https://wa.me/27718584498',
  address: {
    line: 'Farm a Boekenhoutfontein, R565',
    locality: 'Rustenburg',
    region: 'North West',
    postal: '0309',
    country: 'South Africa',
    countryCode: 'ZA',
  },
  tagline: 'Leave Your Footprint in Africa',
};
business.addressFull = `${business.address.line}, ${business.address.locality}, ${business.address.region} ${business.address.postal}, ${business.address.country}`;
business.mapsHref = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(business.addressFull);

export const packages = [
  {
    badge: 'First Timer', name: 'Beginners Safari', days: '6 Day Safari · Bring a friend or loved one', price: '$5,000',
    animals: '1× Impala, 1× Blesbok, 1× Warthog, 1× Wildebeest',
    desc: 'The perfect package for your first hunt — a gentle introduction to fair-chase safari hunting in South Africa.',
  },
  {
    badge: 'Most Popular', name: 'Deluxe Safari', days: '8 Day Safari', price: '$7,000', featured: true,
    animals: '1× Impala, 1× Blesbok, 1× Warthog, 1× Blue Wildebeest, 1× Zebra, 1× Baboon',
    desc: 'Includes a wider selection of animals and a longer hunt duration for a fuller South African trophy experience.',
  },
  {
    badge: 'Comprehensive', name: 'Premium Safari', days: '10 Day Safari · Bring a friend or loved one', price: '$11,000',
    animals: '1× Impala, 1× Nyala, 1× Blue Wildebeest, 1× Zebra, 1× Kudu',
    desc: 'Our comprehensive package for experienced hunters seeking a premium selection of trophies.',
  },
];

export const rates = [
  { label: '1 Hunter × 1 PH', value: '$450', sub: 'per day' },
  { label: '2 Hunters × 1 PH', value: '$400', sub: 'per hunter, per day' },
  { label: 'Non-Hunter (Observer)', value: '$350', sub: 'per day' },
];

export const inclusive = [
  'Airport pick-up and drop-off',
  'Hunting licence fees',
  'Dedicated Professional Hunter',
  'Well-equipped hunting vehicle',
  'Accommodation in thatch and stone-built lodging',
  'All land transfer while on safari',
  'All meals, drinks, wifi and laundry services',
  'Welcoming lodge staff, chefs, trackers &amp; skinners',
  'A tour of the Paul Kruger Museum on our reserve',
];

export const exclusive = [
  'Internal &amp; domestic flights',
  'Shipping &amp; taxidermy',
  'Day fee for day of arrival and first night in camp',
  'Trophy handling fee',
  'Rifle hire &amp; ammunition',
  'Value-Added Tax (VAT)',
  'Additional meals and alcoholic beverages',
  'Any animal wounded and found or lost will be considered hunted, full fee applies',
  'Additional permits for certain requested species',
  'Local transfer / additional activities',
  'Gratuities, at your discretion',
];

export const enquireTags = ['Trophy Animals — RW/SCI', 'Alternative Species', 'Videographer', 'Bow Hunting', 'Fishing Excursions'];

export const about = [
  'Based on Farm a Boekenhoutfontein along the R565 near Rustenburg, in South Africa\'s North West province, Ripley Safaris offers an exclusive hunting experience in thatch and stone-built lodging on a privately run reserve.',
  'Specializing in plains game hunting, we are committed to delivering a high-quality, ethical experience, guided by a dedicated professional hunter matched to every booking.',
  'At Ripley Safaris, we offer more than just a hunt; we provide an immersive African experience — including a tour of the Paul Kruger Museum on our reserve — where clients can enjoy the beauty and challenge of the wild while contributing to conservation.',
  'Our reserve is a historic property once owned by former South African President Paul Kruger in the 1800s, and his legacy lives on across the farm — from the museum housing his artefacts to the sense of history that surrounds every hunt.',
];

export const crossBorder = 'Looking to add another country to your trophy list? We arrange <strong>cross-border hunting safaris into Namibia</strong> alongside your South African hunt — ask our team about combining both destinations.';

export const lodge = [
  { img: 'lodge-bedroom', alt: 'Stone and thatch lodge cottage with a timber bench and a garden path', title: 'Hunters\' Lodge', text: 'Thatch and stone-built lodging overlooking the reserve.', ratio: '4x5', pos: '40% 50%' },
  { img: 'lodge-lodge-exterior', alt: 'Lodge suite with a carved headboard, lamps and a private bathroom', title: 'Bed room', text: 'Immersive suites with private bathrooms.', ratio: '4x5', pos: '50% 50%' },
  { img: 'lodge-boma-lounge', alt: 'A table laid for dinner beside the fire in the boma at night', title: 'The Boma &amp; Lounge', text: 'Traditional boma for evening stories.', ratio: '4x5', pos: '50% 60%' },
];

// Interest / hunt-type / source options for the enquiry form (unchanged from the original form)
export const formOptions = {
  interest: ['Quote', 'Price List', 'General Information'],
  package: ['Beginners Safari', 'Deluxe Safari', 'Premium Safari', 'Custom / Not Sure Yet'],
  hunt: ['Plains Game', 'Dangerous Game', 'Bow Hunting', 'Cross-Border (Namibia)', 'Fishing', 'Videographer'],
  source: ['Referral', 'Social Media', 'Search / Website', 'Other'],
};

// Which photograph represents each species page.
// Where the owner supplied a high-resolution original it is used; otherwise the only file that exists is used
// at (never above) its native size — see README "Photography" for the list of species that need better photos.
export const speciesPhotos = {
  'blesbuck':        { id: 'image00243', alt: 'Blesbok grazing on open grassland', pos: '50% 50%' },
  'blue-wildebeest': { id: 'image00240', alt: 'Blue wildebeest bull standing in dry golden grass', pos: '45% 50%' },
  'buffalo':         { id: 'buffalo', alt: 'Close portrait of a Cape buffalo with heavy, curled horns', pos: '50% 40%' },
  'burchell-zebra':  { id: 'image00247', alt: 'Burchell\'s zebra standing in long green grass', pos: '38% 50%' },
  'cape-eland':      { id: 'image00246', alt: 'Cape eland among bush and trees', pos: '40% 50%' },
  'giraffe':         { id: 'image00259', alt: 'Giraffes rising above the bushveld canopy', pos: '82% 50%' },
  'greater-kudu':    { id: 'image00249', alt: 'Greater kudu bull with spiralled horns in thick green bush', pos: '60% 50%' },
  'impala':          { id: 'sp-impala', alt: 'Impala', pos: '50% 50%' },
  'nyala':           { id: 'nyala-bull', alt: 'Nyala bull standing in green grass', pos: '50% 45%' },
  'waterbuck':       { id: 'image00244', alt: 'Waterbuck bull standing in green grassland', pos: '65% 50%' },
};
