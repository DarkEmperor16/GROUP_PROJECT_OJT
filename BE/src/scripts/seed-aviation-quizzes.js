/**
 * Seed Script for Aviation University Courses & Quizzes Data
 *
 * Populates MongoDB with realistic aviation subjects, quizzes (embedded questions),
 * standalone QuizQuestions (AI review pool), and student enrollments.
 *
 * Run: npm run db:seed:aviation  (or node src/scripts/seed-aviation-quizzes.js)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const Enrollment = require('../models/Enrollment');
const { connectDB } = require('../config/db');

async function seedAviationData() {
  try {
    console.log('✈️  Starting Aviation University Quiz Data Seed Script…');
    await connectDB();

    // 1. Users setup (Default student & Aviation Teacher)
    console.log('\n👤  Seeding users…');
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    const usersToSeed = [
      {
        fullName: 'Aviation Student',
        email: 'student@academy.edu',
        passwordHash: defaultPasswordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        fullName: 'Captain John Miller (Aviation Faculty)',
        email: 'captain.miller@academy.edu',
        passwordHash: defaultPasswordHash,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    ];

    for (const userData of usersToSeed) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`  ✅ Created User: [${userData.role}] ${userData.email}`);
      } else {
        console.log(`  ℹ️ User [${userData.email}] already exists`);
      }
    }

    const teacher = await User.findOne({ email: 'captain.miller@academy.edu' }) || await User.findOne({ role: 'TEACHER' });
    const student = await User.findOne({ email: 'student@academy.edu' });

    // 2. Aviation Courses
    const aviationCourses = [
      {
        title: 'Principles of Aviation & Aerodynamics',
        code: 'AVN101',
        description: 'Fundamental principles of flight, aerodynamic forces, aircraft structures, stability, and flight control systems.',
        teacherId: teacher._id,
        status: 'ACTIVE',
      },
      {
        title: 'Aviation Meteorology & Weather Analysis',
        code: 'MET201',
        description: 'Atmospheric physics, weather hazards, METAR/TAF decoding, icing, turbulence, and thunderstorms.',
        teacherId: teacher._id,
        status: 'ACTIVE',
      },
      {
        title: 'Air Navigation & Flight Planning',
        code: 'NAV301',
        description: 'Instrument navigation, VOR, NDB, ILS, GPS/RNAV, flight planning, wind triangle calculations, and chart reading.',
        teacherId: teacher._id,
        status: 'ACTIVE',
      },
      {
        title: 'Air Traffic Control & Airspace Operations',
        code: 'ATC401',
        description: 'ICAO regulations, standard phraseology, radar/non-radar separation standards, tower and approach control.',
        teacherId: teacher._id,
        status: 'ACTIVE',
      },
      {
        title: 'Aircraft Maintenance & Airworthiness Engineering',
        code: 'AMT501',
        description: 'Turbine and piston engines, avionics systems, airworthiness directives, maintenance regulations, and safety management.',
        teacherId: teacher._id,
        status: 'ACTIVE',
      },
    ];

    console.log('\n📚  Seeding Aviation Courses…');
    const courseMap = {};
    for (const courseData of aviationCourses) {
      let c = await Course.findOne({ code: courseData.code });
      if (!c) {
        c = await Course.create(courseData);
        console.log(`  ✅ Created Course: [${c.code}] ${c.title}`);
      } else {
        console.log(`  ℹ️ Course [${c.code}] already exists`);
      }
      courseMap[c.code] = c;
    }

    // 3. Quizzes with Embedded Questions (Quiz collection)
    console.log('\n📝  Seeding Quizzes (Quiz model with embedded questions)…');

    const sampleQuizzes = [
      // --- AVN101 Quizzes ---
      {
        title: 'AVN101 Midterm: Aerodynamics & Lift Principles',
        courseId: courseMap['AVN101']._id,
        timeLimit: 20,
        status: 'ACTIVE',
        questions: [
          {
            text: 'What is the primary factor that generates aerodynamic lift on a cambered airfoil?',
            options: [
              'Pressure differential created by higher velocity airflow over the upper surface',
              'Gravity pulling air downward behind the trailing edge',
              'Thermal expansion of air within the wing core',
              'Centrifugal force during turns'
            ],
            correctAnswer: 0,
            explanation: 'According to Bernoulli’s principle and pressure distribution, faster moving air over the curved upper surface creates lower pressure compared to the bottom surface, creating lift.'
          },
          {
            text: 'Which control surface governs the movement of an aircraft around its lateral axis (pitch)?',
            options: ['Ailerons', 'Rudder', 'Elevator', 'Flaps'],
            correctAnswer: 2,
            explanation: 'The elevator controls pitch attitude around the lateral axis.'
          },
          {
            text: 'What happens to the stalling speed of an aircraft as the bank angle increases in a coordinated turn?',
            options: [
              'Stalling speed decreases',
              'Stalling speed increases due to higher load factor',
              'Stalling speed remains unchanged',
              'Stalling speed drops to zero'
            ],
            correctAnswer: 1,
            explanation: 'Higher bank angles increase the load factor (G-load), which increases the effective stall speed.'
          },
          {
            text: 'The four fundamental forces acting on an unaccelerated aircraft in straight-and-level flight are:',
            options: [
              'Lift, Weight, Thrust, and Drag',
              'Gravity, Friction, Inertia, and Power',
              'Centrifugal, Centripetal, Thrust, and Gravity',
              'Speed, Mass, Altitude, and Air Density'
            ],
            correctAnswer: 0,
            explanation: 'In steady level flight, Lift equals Weight and Thrust equals Drag.'
          },
          {
            text: 'What is the Angle of Attack (AoA)?',
            options: [
              'The angle between the wing chord line and the pitch horizon',
              'The angle between the wing chord line and the relative wind',
              'The angle between the longitudinal axis and the ground',
              'The angle formed by the wing flap extension'
            ],
            correctAnswer: 1,
            explanation: 'AoA is strictly the acute angle between the airfoil chord line and the direction of the relative wind.'
          }
        ]
      },
      {
        title: 'AVN101 Final Exam: Aircraft Stability & Control Systems',
        courseId: courseMap['AVN101']._id,
        timeLimit: 30,
        status: 'ACTIVE',
        questions: [
          {
            text: 'Which component provides longitudinal stability in a conventional airplane design?',
            options: ['Vertical Stabilizer', 'Horizontal Stabilizer', 'Wing Dihedral', 'Spoilerons'],
            correctAnswer: 1,
            explanation: 'The horizontal stabilizer produces tail-down force to balance CG movements and maintain pitch stability.'
          },
          {
            text: 'Induced drag decreases as an aircraft’s airspeed:',
            options: ['Increases', 'Decreases', 'Remains constant', 'Approaches zero'],
            correctAnswer: 0,
            explanation: 'Induced drag is inversely proportional to the square of airspeed. As speed increases, induced drag decreases while parasite drag increases.'
          },
          {
            text: 'What condition causes ground effect when landing?',
            options: [
              'Increased wingtip vortices near the ground',
              'Reduction of induced drag when flying within one wingspan height above the runway',
              'Increased skin friction drag from ground reflections',
              'Thermal updrafts from hot asphalt'
            ],
            correctAnswer: 1,
            explanation: 'Ground effect restricts wingtip vortex formation, decreasing downwash and induced drag near the surface.'
          },
          {
            text: 'Adverse yaw during a roll is caused by:',
            options: [
              'Increased drag on the wing with the raised aileron',
              'Increased induced drag on the wing with the lowered aileron (upgoing wing)',
              'Engine torque reaction',
              'Rudder deflection'
            ],
            correctAnswer: 1,
            explanation: 'The downward deflected aileron increases camber and lift, which increases induced drag on that wing, pulling the nose opposite the direction of turn.'
          },
          {
            text: 'What is the primary function of wing flaps during approach?',
            options: [
              'To increase cruise speed',
              'To increase lift and drag, allowing steeper approach without increasing airspeed',
              'To reduce fuel consumption',
              'To prevent engine overheating'
            ],
            correctAnswer: 1,
            explanation: 'Flaps increase wing camber, increasing both lift coefficient and drag, allowing slower touchdown speeds and steeper descent angles.'
          }
        ]
      },

      // --- MET201 Quizzes ---
      {
        title: 'MET201 Midterm: Aviation Weather & METAR Decoding',
        courseId: courseMap['MET201']._id,
        timeLimit: 15,
        status: 'ACTIVE',
        questions: [
          {
            text: 'In a METAR report, what does the code "TSRA" indicate?',
            options: [
              'Tropical Storm with Rain',
              'Thunderstorm with Moderate Rain',
              'Tornado Hazard Area',
              'Thin Stratocumulus Rain'
            ],
            correctAnswer: 1,
            explanation: 'TS = Thunderstorm, RA = Rain.'
          },
          {
            text: 'What atmospheric condition is necessary for structural icing to occur on an airframe?',
            options: [
              'Relative humidity below 50% and temperature below 0°C',
              'Visible liquid moisture (clouds/rain) and ambient temperature at or below 0°C',
              'High pressure and clear blue skies',
              'Sub-zero temperatures regardless of moisture'
            ],
            correctAnswer: 1,
            explanation: 'Structural icing requires visible liquid water (supercooled droplets) and airframe surface temperature at freezing or below.'
          },
          {
            text: 'What type of cloud is associated with severe turbulence, microbursts, and hail?',
            options: ['Cirrus', 'Cumulonimbus (CB)', 'Stratus', 'Altocumulus'],
            correctAnswer: 1,
            explanation: 'Cumulonimbus clouds are thunderstorm clouds capable of producing extreme weather hazards.'
          },
          {
            text: 'What does QNH pressure setting represent on an altimeter?',
            options: [
              'Altimeter setting adjusted to Sea Level Pressure according to ISA',
              'Pressure setting to read zero at airfield elevation',
              'Standard pressure setting 1013.25 hPa / 29.92 inHg',
              'True height above ground level'
            ],
            correctAnswer: 0,
            explanation: 'QNH sets the altimeter to indicate altitude above Mean Sea Level (MSL).'
          },
          {
            text: 'A wind shear encounter during final approach is characterized by:',
            options: [
              'A sudden change in wind direction and/or speed impacting airspeed and glidepath',
              'Constant steady headwind',
              'Smooth laminar airflow over the runway',
              'Gradual barometric pressure drop'
            ],
            correctAnswer: 0,
            explanation: 'Wind shear involves abrupt shifts in wind vector capable of causing hazardous loss of airspeed or altitude.'
          }
        ]
      },
      {
        title: 'MET201 Final Exam: Severe Weather Hazards & TAF Interpretation',
        courseId: courseMap['MET201']._id,
        timeLimit: 25,
        status: 'ACTIVE',
        questions: [
          {
            text: 'In a Terminal Aerodrome Forecast (TAF), what does "PROB40 1216 2000 +TSRA" signify?',
            options: [
              '40% probability between 1200Z and 1600Z of 2000m visibility with heavy rain and thunderstorms',
              '40 knot winds gusting to 2000 knots',
              'Probability of 40 clear weather hours',
              'Storm lasting exactly 40 minutes'
            ],
            correctAnswer: 0,
            explanation: 'PROB40 indicates a 40% chance of the specified weather phenomenon during the time window.'
          },
          {
            text: 'What phenomenon causes radiation fog to form?',
            options: [
              'Warm moist air moving over cold water',
              'Terrestrial cooling of the earth surface on clear, calm nights',
              'Strong cold fronts lifting warm moist air',
              'Volcanic ash particles in the upper atmosphere'
            ],
            correctAnswer: 1,
            explanation: 'Radiation fog forms when the ground cools rapidly by terrestrial radiation under clear skies and light winds.'
          },
          {
            text: 'What is a Microburst?',
            options: [
              'A small tornadic vortex lasting several hours',
              'An intense localized downdrafts producing damaging outflow winds near the ground',
              'A high altitude jet stream fluctuation',
              'A rapid pressure rise in a warm front'
            ],
            correctAnswer: 1,
            explanation: 'Microbursts are severe low-level wind shear hazards with downburst diameters under 4km.'
          },
          {
            text: 'Standard Sea Level Temperature and Pressure under ISA are:',
            options: [
              '15°C and 1013.25 hPa (29.92 inHg)',
              '0°C and 1000 hPa',
              '20°C and 1015 hPa',
              '25°C and 29.00 inHg'
            ],
            correctAnswer: 0,
            explanation: 'ISA standard sea level conditions are defined as 15°C temperature and 1013.25 hPa / 29.92 inHg barometric pressure.'
          },
          {
            text: 'Clear Air Turbulence (CAT) is most commonly encountered:',
            options: [
              'Inside low-altitude stratus clouds',
              'Near the jet stream at high altitudes without cloud visual indications',
              'Over ocean water during noon hours',
              'Inside hurricane eyewalls'
            ],
            correctAnswer: 1,
            explanation: 'CAT typically occurs at high altitudes near upper-level jet streams in clear air due to steep wind shear.'
          }
        ]
      },

      // --- NAV301 Quizzes ---
      {
        title: 'NAV301 Midterm: Radio Navigation & VOR/ILS Operations',
        courseId: courseMap['NAV301']._id,
        timeLimit: 20,
        status: 'ACTIVE',
        questions: [
          {
            text: 'What does a VOR Course Deviation Indicator (CDI) full scale deflection represent?',
            options: [
              '10 degrees off course',
              '2 degrees off course',
              '5 degrees off course',
              '20 nautical miles off course'
            ],
            correctAnswer: 0,
            explanation: 'Full scale CDI deflection on a standard VOR indicator corresponds to 10 degrees of angular course deviation.'
          },
          {
            text: 'An Instrument Landing System (ILS) consists of which two primary guidance beams?',
            options: [
              'Localizer (horizontal) and Glide Path / Glide Slope (vertical)',
              'Radar altimeter and VOR radial',
              'NDB bearing line and GPS waypoint',
              'DME distance and Transponder mode'
            ],
            correctAnswer: 0,
            explanation: 'ILS provides lateral guidance via the Localizer and vertical descent guidance via the Glide Slope.'
          },
          {
            text: 'What frequency range is allocated for VOR navigation stations?',
            options: [
              '108.00 MHz to 117.95 MHz',
              '118.00 MHz to 136.975 MHz',
              '190 kHz to 535 kHz',
              '960 MHz to 1215 MHz'
            ],
            correctAnswer: 0,
            explanation: 'VHF Omnidirectional Range (VOR) operates in the 108.00–117.95 MHz VHF band.'
          },
          {
            text: 'What is Variation in air navigation?',
            options: [
              'The angular difference between True North and Magnetic North',
              'The difference between Indicated Airspeed and Groundspeed',
              'The error caused by magnetic fields inside the cockpit',
              'The drift angle caused by crosswind'
            ],
            correctAnswer: 0,
            explanation: 'Magnetic variation (isogonic line) is the angle between True Geographic North and Magnetic North.'
          },
          {
            text: 'How many operational satellites are required for GNSS 3D position fixing (Latitude, Longitude, Altitude)?',
            options: ['3 satellites', '4 satellites', '6 satellites', '12 satellites'],
            correctAnswer: 1,
            explanation: 'At least 4 satellites are needed to resolve 3 positional dimensions plus receiver clock offset error.'
          }
        ]
      },
      {
        title: 'NAV301 Final Exam: Flight Planning & Performance Calculations',
        courseId: courseMap['NAV301']._id,
        timeLimit: 25,
        status: 'ACTIVE',
        questions: [
          {
            text: 'Given a True Course of 090°, Magnetic Variation 10°E, and Drift Angle 5° Left, what is the Magnetic Heading?',
            options: ['075°', '080°', '085°', '095°'],
            correctAnswer: 0,
            explanation: 'True Heading = TC + Drift (090 - 5 = 085°). Magnetic Heading = TH - East Variation (085 - 10 = 075°).'
          },
          {
            text: 'Density Altitude is defined as:',
            options: [
              'Pressure altitude corrected for non-standard temperature',
              'Indicated altitude shown on the altimeter',
              'Exact height above ground level (AGL)',
              'Altitude where air density is maximum'
            ],
            correctAnswer: 0,
            explanation: 'High temperature lowers air density, raising the density altitude and reducing engine/aerodynamic performance.'
          },
          {
            text: 'What does the term "Point of No Return" (PNR) mean in transoceanic flight planning?',
            options: [
              'The maximum point from which an aircraft can return to the departure airport with minimum fuel reserves',
              'The point of touchdown on the destination runway',
              'The point where cruising altitude is reached',
              'The halfway point by geographic distance'
            ],
            correctAnswer: 0,
            explanation: 'PNR is the furthest distance point along a track from which the aircraft can safely turn back to departure.'
          },
          {
            text: 'Standard VFR cruising altitude rule for a magnetic track between 000° and 179° in odd thousands + 500ft applies to:',
            options: ['Eastbound flights', 'Westbound flights', 'Northbound flights only', 'Instrument IFR flights'],
            correctAnswer: 0,
            explanation: 'The "Odd People Fly East" rule dictates odd thousands + 500ft VFR altitudes for magnetic tracks 000° to 179°.'
          },
          {
            text: 'What instrument utilizes both static pressure and pitot pressure sources?',
            options: ['Airspeed Indicator (ASI)', 'Altimeter', 'Vertical Speed Indicator (VSI)', 'Attitude Indicator'],
            correctAnswer: 0,
            explanation: 'ASI measures dynamic pressure (Pitot pressure minus Static pressure). Altimeter and VSI use static pressure only.'
          }
        ]
      },

      // --- ATC401 Quizzes ---
      {
        title: 'ATC401 Midterm: ATC Phraseology & Airspace Standards',
        courseId: courseMap['ATC401']._id,
        timeLimit: 15,
        status: 'ACTIVE',
        questions: [
          {
            text: 'What standard ICAO phraseology must a pilot use when acknowledging a runway hold-short instruction?',
            options: [
              'Wilco, holding short',
              'Full readback including runway designator and "Holding Short"',
              'Roger',
              'Affirmative, copied'
            ],
            correctAnswer: 1,
            explanation: 'ICAO Annex 11 mandates full readback of all hold-short instructions including runway designators.'
          },
          {
            text: 'What transponder code (Squawk) indicates a radio communication failure (NORDO)?',
            options: ['7500', '7600', '7700', '1200'],
            correctAnswer: 1,
            explanation: '7500 = Hijack, 7600 = Radio Failure, 7700 = General Emergency.'
          },
          {
            text: 'Class A Airspace in the United States and many ICAO states extends from:',
            options: [
              'FL180 (18,000 ft MSL) up to and including FL600',
              'Surface up to 2,500 ft AGL',
              '10,000 ft MSL to 14,000 ft MSL',
              'FL240 to FL450'
            ],
            correctAnswer: 0,
            explanation: 'Class A airspace generally encompasses FL180 to FL600 where all operations must be under IFR rules.'
          },
          {
            text: 'What is the standard minimum radar separation between aircraft operating at the same altitude in en-route environment?',
            options: ['3 nautical miles', '5 nautical miles', '10 nautical miles', '1 nautical mile'],
            correctAnswer: 1,
            explanation: 'Standard en-route ATC radar separation is 5 NM horizontal separation.'
          },
          {
            text: 'What instruction does ATC issue when directing a pilot to maintain current heading until advised?',
            options: ['Fly heading (degrees)', 'Maintain present heading', 'Continue on track', 'Hold position'],
            correctAnswer: 1,
            explanation: '"Maintain present heading" instructs the pilot to hold the heading currently shown on the directional gyro.'
          }
        ]
      },
      {
        title: 'ATC401 Final Exam: Separation Minima & Emergency Procedures',
        courseId: courseMap['ATC401']._id,
        timeLimit: 25,
        status: 'ACTIVE',
        questions: [
          {
            text: 'When a pilot declares "MAYDAY MAYDAY MAYDAY", what type of situation is being reported?',
            options: [
              'Distress (imminent danger requiring immediate assistance)',
              'Urgency concerning safety of aircraft/personnel',
              'Routine fuel advisory',
              'Minor radio malfunction'
            ],
            correctAnswer: 0,
            explanation: 'MAYDAY signals a distress condition; PAN PAN signals an urgency condition.'
          },
          {
            text: 'What is the standard vertical separation minimum (RVSM) between FL290 and FL410?',
            options: ['2,000 feet', '1,000 feet', '500 feet', '4,000 feet'],
            correctAnswer: 1,
            explanation: 'Reduced Vertical Separation Minimum (RVSM) permits 1,000 ft vertical separation between FL290 and FL410 for equipped aircraft.'
          },
          {
            text: 'What does the term "CLEARED FOR THE APPROACH" authorize a pilot to do?',
            options: [
              'Land immediately without tower contact',
              'Execute the published instrument approach procedure for the assigned runway',
              'Taxi to the gate',
              'Descend to ground elevation immediately'
            ],
            correctAnswer: 1,
            explanation: 'It authorizes the pilot to execute the published IAP, but landing clearance remains required from Tower.'
          },
          {
            text: 'Under ICAO rules, what is "TCAS II" Resolution Advisory (RA)?',
            options: [
              'A mandatory flight maneuver instruction to avoid mid-air collision',
              'A visual traffic warning map',
              'An ATC voice message broadcast',
              'A weather radar alert'
            ],
            correctAnswer: 0,
            explanation: 'A TCAS RA provides immediate vertical maneuver instructions (e.g. "Climb, Climb") that take precedence over ATC clearances.'
          },
          {
            text: 'What is the standard squawk code for VFR aircraft in North American airspace without specific assignment?',
            options: ['7000', '1200', '7700', '0000'],
            correctAnswer: 1,
            explanation: '1200 is standard VFR squawk in US/Canada (7000 is standard in ICAO/Europe).'
          }
        ]
      },

      // --- AMT501 Quizzes ---
      {
        title: 'AMT501 Midterm: Powerplant & Turbomachinery Basics',
        courseId: courseMap['AMT501']._id,
        timeLimit: 20,
        status: 'ACTIVE',
        questions: [
          {
            text: 'In a turbofan engine, what is the Bypass Ratio?',
            options: [
              'Ratio of air mass flow passing around the engine core vs flow passing through the core',
              'Ratio of fuel consumed per hour vs thrust produced',
              'Ratio of compressor pressure rise vs turbine pressure drop',
              'Ratio of engine weight vs total airplane takeoff weight'
            ],
            correctAnswer: 0,
            explanation: 'Bypass ratio compares cold fan airflow bypassing the combustion chamber against hot core airflow.'
          },
          {
            text: 'What major hazard is caused by Compressor Stall in a gas turbine engine?',
            options: [
              'Breakdown of smooth airflow through compressor blades causing reverse flow and violent surge',
              'Instantaneous freezing of fuel lines',
              'Excessive electrical output from generator',
              'Hydraulic line pressure drop'
            ],
            correctAnswer: 0,
            explanation: 'Compressor stall occurs when aerodynamic angle of attack on compressor blades exceeds critical limit, leading to surge.'
          },
          {
            text: 'What is the purpose of an Airworthiness Directive (AD) issued by aviation authorities (FAA/EASA)?',
            options: [
              'Mandatory maintenance modification or inspection required to correct an unsafe aircraft condition',
              'Optional performance upgrade recommendation',
              'Pilot training manual amendment',
              'Airport noise abatement guideline'
            ],
            correctAnswer: 0,
            explanation: 'ADs are legally binding regulations issued to rectify unsafe conditions in aircraft, engines, or components.'
          },
          {
            text: 'Which non-destructive testing (NDT) method is best suited for detecting surface cracks in aluminum alloy aircraft skins?',
            options: [
              'Eddy Current Testing / Dye Penetrant Testing',
              'Magnetic Particle Inspection (MPI)',
              'Ultrasonic Depth Gauge',
              'Barometer Test'
            ],
            correctAnswer: 0,
            explanation: 'Dye penetrant and eddy current work on non-ferrous metals like aluminum (MPI works only on ferromagnetic metals).'
          },
          {
            text: 'What is the function of an aircraft Auxiliary Power Unit (APU)?',
            options: [
              'Provides electrical power and pneumatic air for engine starting and air conditioning on the ground/in flight',
              'Drives the main landing gear wheels during taxiing',
              'Acts as primary propulsion during emergency descent',
              'Filters engine exhaust emissions'
            ],
            correctAnswer: 0,
            explanation: 'The APU is a small gas turbine engine that generates electrical and pneumatic power independently of main engines.'
          }
        ]
      },
      {
        title: 'AMT501 Final Exam: Avionics & Airworthiness Inspection',
        courseId: courseMap['AMT501']._id,
        timeLimit: 30,
        status: 'ACTIVE',
        questions: [
          {
            text: 'What is the minimum inspection interval requirement for general aviation aircraft operated for hire under FAR 91 / ICAO standards?',
            options: ['100-hour inspection', '500-hour inspection', 'Annual inspection only', '24-month inspection'],
            correctAnswer: 0,
            explanation: 'Aircraft carrying passengers for hire require a complete 100-hour inspection in addition to the annual inspection.'
          },
          {
            text: 'What does MEL stand for in commercial aircraft operations?',
            options: [
              'Minimum Equipment List',
              'Mandatory Engine Maintenance Log',
              'Master Electrical Line',
              'Maximum Elevator Limit'
            ],
            correctAnswer: 0,
            explanation: 'The MEL allows an aircraft to be dispatched with specific inoperative equipment under strictly defined safety conditions.'
          },
          {
            text: 'What fluid is typically used in modern commercial transport aircraft high-pressure hydraulic systems?',
            options: [
              'Phosphate ester fire-resistant hydraulic fluid (e.g. Skydrol)',
              'Standard automotive engine oil',
              'Ethylene glycol water solution',
              'Mineral-based kerosene'
            ],
            correctAnswer: 0,
            explanation: 'Skydrol (phosphate ester base) is widely used due to high flashpoint and fire resistance at high operating pressures (3,000-5,000 psi).'
          },
          {
            text: 'Primary Flight Display (PFD) in a glass cockpit replaces which traditional analog flight instruments?',
            options: [
              'Six-pack: Attitude, Airspeed, Altimeter, Heading, Turn Coordinator, and VSI',
              'Engine tachometer only',
              'Cabin pressure gauge only',
              'Fuel quantity indicators only'
            ],
            correctAnswer: 0,
            explanation: 'The PFD consolidates the basic "six-pack" flight instruments into a single integrated digital screen.'
          },
          {
            text: 'FADEC in modern turbine aircraft powerplants stands for:',
            options: [
              'Full Authority Digital Engine Control',
              'Fast Action Dual Fuel Controller',
              'Flight Altitude Dynamics Electronic Computer',
              'Federal Aviation Data Engineering Center'
            ],
            correctAnswer: 0,
            explanation: 'FADEC is a computer-controlled system that manages engine performance parameters without manual pilot intervention.'
          }
        ]
      }
    ];

    for (const quizData of sampleQuizzes) {
      const existing = await Quiz.findOne({ title: quizData.title, courseId: quizData.courseId });
      if (!existing) {
        const q = await Quiz.create(quizData);
        console.log(`  ✅ Created Quiz: "${q.title}" (${q.questions.length} embedded questions)`);
      } else {
        console.log(`  ℹ️ Quiz "${existing.title}" already exists`);
      }
    }

    // 4. Standalone QuizQuestions Pool (QuizQuestion collection for AI review pool)
    console.log('\n🤖  Seeding Standalone QuizQuestions (Teacher/AI Review Pool)…');

    const standaloneQuestions = [
      // AVN101
      {
        courseId: courseMap['AVN101']._id,
        questionContent: 'What aerodynamic phenomenon causes Mach Tuck at transonic speeds?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { key: 'A', content: 'Rearward shift of center of pressure causing a pitch-down moment' },
          { key: 'B', content: 'Forward shift of center of gravity' },
          { key: 'C', content: 'Loss of rudder authority' },
          { key: 'D', content: 'Excessive elevator flutter' }
        ],
        correctAnswer: 'A',
        explanation: 'As airflow over the wing becomes supersonic, the center of pressure moves rearward, creating a pitch-down (tuck) tendency.',
        source: 'AI_GENERATED',
        reviewStatus: 'GOOD',
        reviewedBy: teacher._id,
        reviewedAt: new Date()
      },
      {
        courseId: courseMap['AVN101']._id,
        questionContent: 'True or False: An airplane will stall at the exact same indicated airspeed regardless of weight or load factor.',
        questionType: 'TRUE_FALSE',
        options: [
          { key: 'A', content: 'True' },
          { key: 'B', content: 'False' }
        ],
        correctAnswer: 'B',
        explanation: 'False. Stall speed increases with weight and bank angle (load factor). Critical angle of attack remains constant, not airspeed.',
        source: 'AI_GENERATED',
        reviewStatus: 'NEEDS_REVIEW',
        teacherReviewNote: 'Verify wording regarding critical angle of attack.'
      },

      // MET201
      {
        courseId: courseMap['MET201']._id,
        questionContent: 'Which weather radar return color typically indicates extreme precipitation and potential hail inside a thunderstorm cell?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { key: 'A', content: 'Green' },
          { key: 'B', content: 'Yellow' },
          { key: 'C', content: 'Red / Magenta' },
          { key: 'D', content: 'Light Blue' }
        ],
        correctAnswer: 'C',
        explanation: 'Red and Magenta represent high reflectivity (>50 dBZ), corresponding to heavy rainfall or hail.',
        source: 'AI_GENERATED',
        reviewStatus: 'GOOD',
        reviewedBy: teacher._id,
        reviewedAt: new Date()
      },
      {
        courseId: courseMap['MET201']._id,
        questionContent: 'What causes Mountain Wave turbulence on the leeward side of mountain ranges?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { key: 'A', content: 'Strong winds (>25 kts) flowing perpendicular to mountain ridges under stable atmospheric conditions' },
          { key: 'B', content: 'High surface temperatures causing thermal updrafts' },
          { key: 'C', content: 'Tropical low pressure zones' },
          { key: 'D', content: 'Sea breeze fronts' }
        ],
        correctAnswer: 'A',
        explanation: 'Strong winds crossing high terrain produce severe standing wave oscillations and rotor turbulence downwind.',
        source: 'AI_GENERATED',
        reviewStatus: 'GOOD'
      },

      // NAV301
      {
        courseId: courseMap['NAV301']._id,
        questionContent: 'What is the primary operational advantage of RNAV (Area Navigation) over conventional airways?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { key: 'A', content: 'Allows direct flight paths between any desired waypoints without overflying ground VOR stations' },
          { key: 'B', content: 'Eliminates the need for altimeter setting' },
          { key: 'C', content: 'Guarantees zero wind drift' },
          { key: 'D', content: 'Prevents bird strikes' }
        ],
        correctAnswer: 'A',
        explanation: 'RNAV enables point-to-point navigation independent of ground beacon locations using GPS and INS.',
        source: 'AI_GENERATED',
        reviewStatus: 'GOOD'
      },

      // ATC401
      {
        courseId: courseMap['ATC401']._id,
        questionContent: 'When instructed by ATC to "CLEARED TO LAND RUNWAY 25L, WIND 240 AT 12 KNOTS", what is the pilot required to read back?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { key: 'A', content: 'Landing clearance and runway designation ("Cleared to land Runway 25L")' },
          { key: 'B', content: 'Wind speed only' },
          { key: 'C', content: 'Only callsign' },
          { key: 'D', content: 'No response required' }
        ],
        correctAnswer: 'A',
        explanation: 'ICAO mandates reading back landing clearances with the specific assigned runway identifier.',
        source: 'AI_GENERATED',
        reviewStatus: 'GOOD'
      },

      // AMT501
      {
        courseId: courseMap['AMT501']._id,
        questionContent: 'What is the purpose of magnetic chip detectors installed in turbine engine lubrication systems?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { key: 'A', content: 'To attract and trap ferrous metal debris, alerting technicians to impending bearing/gear failure' },
          { key: 'B', content: 'To measure engine RPM' },
          { key: 'C', content: 'To clean fuel impurities' },
          { key: 'D', content: 'To control oil pressure' }
        ],
        correctAnswer: 'A',
        explanation: 'Chip detectors capture magnetic particles shed by failing gears or bearings before catastrophic engine failure occurs.',
        source: 'AI_GENERATED',
        reviewStatus: 'GOOD'
      }
    ];

    for (const qData of standaloneQuestions) {
      const existing = await QuizQuestion.findOne({
        courseId: qData.courseId,
        questionContent: qData.questionContent
      });
      if (!existing) {
        await QuizQuestion.create(qData);
        console.log(`  ✅ Created QuizQuestion: "${qData.questionContent.substring(0, 60)}…"`);
      } else {
        console.log(`  ℹ️ QuizQuestion already exists for course [${qData.courseId}]`);
      }
    }

    // 5. Enroll Student into all Aviation Courses
    console.log('\n🎓  Enrolling seed student in Aviation Courses…');
    if (student) {
      for (const courseCode of Object.keys(courseMap)) {
        const course = courseMap[courseCode];
        const existing = await Enrollment.findOne({
          studentId: student._id,
          courseId: course._id,
        });

        if (!existing) {
          await Enrollment.create({
            studentId: student._id,
            courseId: course._id,
            status: 'ACTIVE',
          });
          console.log(`  ✅ Enrolled student in: [${course.code}] ${course.title}`);
        } else {
          console.log(`  ℹ️ Already enrolled in: [${course.code}] ${course.title}`);
        }
      }
    } else {
      console.warn('  ⚠️ Student account not found — skipping enrollments.');
    }

    console.log('\n🎉  Aviation Quiz Data Seed Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌  Aviation Seed Script Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedAviationData();
