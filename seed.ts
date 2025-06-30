import {
  UserRole,
  TicketType,
  BillingType,
  PrismaClient,
  TicketStatus,
  RewardPointsType,
  ProductAvailability,
} from '@prisma/client';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { round } from 'lodash';
import { nanoid } from 'nanoid';
import { scheduled, retry, firstValueFrom, asyncScheduler } from 'rxjs';
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { faker } from '@faker-js/faker/locale/en';
import { take, chunk, random, shuffle } from 'lodash';

const defaultRights = {
  CanEnroll: false,
  CanCreateCourse: false,
  CanUpdateCourse: false,
};

const defaultConditions = [
  {
    points: 10,
    active: false,
    title: 'Posting a Reply in Forum',
  },
  {
    points: 10,
    active: false,
    title: 'Create a Forum Topic',
  },
  {
    points: 10,
    active: false,
    title: 'Assignment Pass',
  },
  {
    points: 10,
    active: false,
    title: 'Purchase Store Products',
  },
  {
    points: 10,
    active: false,
    title: 'Course Completion',
  },
  {
    points: 10,
    active: false,
    title: 'Meeting Reservation (Student)',
  },
  {
    points: 10,
    active: false,
    title: 'Meeting Reservation (Instructor)',
  },
  {
    points: 10,
    active: false,
    title: 'Course Review (Rate)',
  },
  {
    points: 10,
    active: false,
    title: 'Registration',
  },
  {
    points: 10,
    active: false,
    title: 'Achieving a Certificate',
  },
  {
    points: 10,
    active: false,
    title: 'New Badge',
  },
];

const totalCourses = 5;
const attachment1 = 'learnloom/attachment1.zip';
const attachment2 = 'learnloom/attachment2.zip';
const attachment3 = 'learnloom/attachment3.pdf';
const lectureVideoSource = 'learnloom/demo-lecture-video.mp4';
const privateBucket = 'https://learnloom.blr1.digitaloceanspaces.com';

const s3 = new S3({
  region: 'blr1',
  bucketEndpoint: true,
  endpoint: privateBucket,
  credentials: {
    accessKeyId: 'DO00GLFDBLV3UTGF82GH',
    secretAccessKey: '9GBQJnNUYkDsq7MClpZxf7Z0vTLUe/7g3uHjZAGmgwU',
  },
});
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding users.');
  await seedUsers();
  console.log('Seeding categories.');
  await seedCategories();
  console.log('Seeding courses');
  await seedCourses();
  console.log('Seeding course reviews');
  await seedCourseReviews();
  console.log('Seeding course lecture groups');
  await seedLectureGroups();
  console.log('Seeding lectures');
  await seedLectures();
  console.log('Seeding lectures assignments');
  await seedAssignments();
  console.log('Seeding associates');
  await seedAssociates();
  console.log('Seeding bundles');
  await seedBundles();
  console.log('Seeding enrollments');
  await seedEnrollments();
  console.log('Seeding statements');
  await seedStatements();
  console.log('Seeding reviews');
  await seedReviews();
  console.log('Seeding blogs');
  await seedBlogs();
  console.log('Seeding blogs comments');
  await seedBlogComments();
  console.log('Seeding threads');
  await seedThreads();
  console.log('Seeding products');
  await seedProducts();
  console.log('Seeding product reviews');
  await seedProductReviews();
  console.log('Seeding tickets');
  await seedTicketsAndComments();
  console.log('Seeding reward points');
  await seedRewardPoints();
  console.log('Seeding store orders');
  await seedStoreOrders();
}

async function seedCategories() {
  const _data = [
    { title: 'Design', icon: 'categories/design_category_icon_.svg' },
    { title: 'Business', icon: 'categories/bussiness_category_icon_.svg' },
    { title: 'Academics', icon: 'categories/academics_category_icon_.svg' },
    { title: 'Lifestyle', icon: 'categories/lifestyle_category_icon_.svg' },
    { title: 'Marketing', icon: 'categories/marketing_category_icon_.svg' },
    { title: 'Management', icon: 'categories/management_category_icon_.svg' },
    { title: 'Development', icon: 'categories/development_category_icon_.svg' },
    {
      title: 'Healt & Finance',
      icon: 'categories/health_and_fitness_category_icon_.svg',
    },
  ].map(async (d) => {
    return {
      icon: d.icon,
      title: d.title,
    };
  });

  const data = await Promise.all(_data);

  try {
    const seeds = await prisma.category.createMany({ data });
    console.log('Total categories seeded: ', seeds.count);
  } catch (err) {
    console.log('Failed to create course categories.');
    console.error(err);
  }
}

// seed users
async function seedUsers() {
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync('adminadmin', salt);
  const roles = [
    UserRole.Admin,
    UserRole.Student,
    UserRole.Instructor,
    UserRole.Organization,
  ];
  const data = [];
  for (const role of roles) {
    for (let i = 1; i <= 3; i++) {
      data.push({
        hash,
        salt,
        role: role,
        rights: defaultRights,
        timezone: 'Asia/Karachi',
        lastName: faker.person.lastName(),
        firstName: faker.person.firstName(),
        username: faker.internet.userName().toLowerCase(),
        profileImage: '',
        bio: faker.person.bio(),
        email: faker.internet.email(),
      });
    }
  }

  try {
    const seeds = await prisma.user.createMany({
      data,
    });
    const users = await prisma.user.findMany();

    const updates = users.map(async (u) => {
      const filename = `${
        u.storageDirectory
      }/profile/images/${faker.system.commonFileName('jpg')}`;
      const imageUrl = faker.image.avatarLegacy();
      const image = await firstValueFrom(
        scheduled(
          axios.get(imageUrl, {
            timeout: 30000,
            responseType: 'stream',
          }),
          asyncScheduler,
        ).pipe(retry(10)),
      );
      const object = new Upload({
        client: s3,
        params: {
          Key: filename,
          Body: image.data,
          ACL: 'public-read',
          Bucket: privateBucket,
        },
      });
      await object.done();
      await prisma.user.update({
        data: { profileImage: filename },
        where: { storageDirectory: u.storageDirectory },
      });
    });

    await Promise.all(updates);

    console.log('Total users seeded:', seeds.count);
  } catch (err) {
    console.log('failed to seed users');
    console.error(err);
  }
}

// seed courses
async function seedCourses() {
  let _count = 1;
  const coursesSeed = [];
  const instructors = await prisma.user.findMany({
    where: { OR: [{ role: 'Instructor' }, { role: 'Organization' }] },
  });
  const categories = await prisma.category.findMany();

  for (const instructor of instructors) {
    while (_count <= totalCourses) {
      const filename = `${
        instructor.storageDirectory
      }/courses/thumbnails/${faker.system.commonFileName('jpg')}`;

      while (true) {
        try {
          const url = faker.image.url({
            width: 1024,
            height: 700,
          });
          const image = await firstValueFrom(
            scheduled(
              axios.get(url, {
                timeout: 300000,
                responseType: 'stream',
              }),
              asyncScheduler,
            ).pipe(retry(30)),
          );

          const object = new Upload({
            client: s3,
            params: {
              Key: filename,
              Body: image.data,
              ACL: 'public-read',
              Bucket: privateBucket,
            },
          });
          await object.done();
          break;
        } catch (err) {
          console.log('ERR WHILE UPLOADING COURSE IMG');
          continue;
        }
      }
      // await new Promise((resolve, _reject) =>
      //   setTimeout(() => resolve(), 1000),
      // );

      const billingType = 'Free';
      // const billingType = shuffle(BillingType)[0];
      const category = take(shuffle(categories), 1)[0];
      coursesSeed.push({
        billingType,
        faqs: [
          {
            title: 'FAQ 1',
            answer: faker.lorem.paragraph(),
          },
          {
            title: 'FAQ 2',
            answer: faker.lorem.paragraph(),
          },
        ],
        requirements: [
          {
            required: true,
            requirement: 'Requirement 1 for course',
          },
          {
            required: false,
            requirement: 'Requirement 2 for course',
          },
        ],
        approved: true,
        published: true,
        thumbnail: filename,
        categoryId: category.id,
        instructorId: instructor.id,
        description: faker.lorem.lines(20),
        title: faker.lorem.words({ min: 2, max: 5 }),
        price: billingType === 'Free' ? 0 : random(50),
        objectives: [
          faker.lorem.sentence({ min: 7, max: 10 }),
          faker.lorem.sentence({ min: 7, max: 10 }),
          faker.lorem.sentence({ min: 7, max: 10 }),
          faker.lorem.sentence({ min: 7, max: 10 }),
          faker.lorem.sentence({ min: 7, max: 10 }),
          faker.lorem.sentence({ min: 7, max: 10 }),
          faker.lorem.sentence({ min: 7, max: 10 }),
          faker.lorem.sentence({ min: 7, max: 10 }),
          faker.lorem.sentence({ min: 7, max: 10 }),
          faker.lorem.sentence({ min: 7, max: 10 }),
        ],
      });

      _count += 1;
    }
    _count = 1;
  }

  const seeds = await prisma.course.createMany({ data: coursesSeed });
  console.log('Total courses seeded:', seeds.count);
}

// seed lecture groups
async function seedLectureGroups() {
  const courses = await prisma.course.findMany();

  const lGroups = [];

  for (const course of courses) {
    for (let i = 1; i <= 5; i++) {
      lGroups.push({
        index: i,
        courseId: course.id,
        title: `Lecture Group ${i}`,
      });
    }
  }

  const seeds = await prisma.lectureGroup.createMany({ data: lGroups });
  console.log('Total lecture groups seeded:', seeds.count);
}

async function seedCourseReviews() {
  const users = await prisma.user.findMany({
    where: { role: { in: [UserRole.Student] } },
  });

  const reviews = [];
  for (const user of users) {
    const courses = await prisma.enrollment.findMany({
      where: { studentId: user.id },
    });
    for (const course of courses) {
      reviews.push({
        userId: user.id,
        courseId: course.id,
        review: faker.word.words({ count: { min: 20, max: 50 } }),
        rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      });
    }
  }

  try {
    const _reviews = await prisma.review.createMany({ data: reviews });
    console.log('Total course reviews seeded:', _reviews.count);
  } catch (err) {
    console.log('failed to seed course reviews');
    console.log(err);
  }
}

// Seed Lectures
async function seedLectures() {
  const data = [];
  const courses = await prisma.course.findMany({
    include: { instructor: true },
  });

  for (const course of courses) {
    const a1 = `${
      course.instructor.storageDirectory
    }/lectures/attachments/${faker.system.commonFileName('zip')}`;
    const a2 = `${
      course.instructor.storageDirectory
    }/lectures/attachments/${faker.system.commonFileName('zip')}`;
    const a3 = `${
      course.instructor.storageDirectory
    }/lectures/attachments/${faker.system.commonFileName('pdf')}`;

    await s3.copyObject({
      Key: a1,
      ACL: 'private',
      Bucket: privateBucket,
      CopySource: attachment1,
    });

    await s3.copyObject({
      Key: a2,
      ACL: 'private',
      Bucket: privateBucket,
      CopySource: attachment2,
    });

    await s3.copyObject({
      Key: a3,
      ACL: 'private',
      Bucket: privateBucket,
      CopySource: attachment3,
    });

    const groups = await prisma.lectureGroup.findMany({
      where: { courseId: course.id },
    });
    for (const group of groups) {
      for (let i = 1; i <= 3; i++) {
        const thumbnail = `${
          course.instructor.storageDirectory
        }/lectures/thumbnails/${nanoid(10)}-${faker.system.commonFileName(
          'jpg',
        )}`;
        const url = faker.image.url({ width: 1024, height: 700 });

        while (true) {
          try {
            const image = await firstValueFrom(
              scheduled(
                axios.get(url, {
                  timeout: 300000,
                  responseType: 'stream',
                }),
                asyncScheduler,
              ).pipe(retry(30)),
            );
            const object = new Upload({
              client: s3,
              params: {
                Key: thumbnail,
                Body: image.data,
                ACL: 'public-read',
                Bucket: privateBucket,
              },
            });
            await object.done();
            break;
          } catch (err) {
            console.log('FAILED TO FETCH IMAGE');
            continue;
          }
        }

        const videoId = `${
          course.instructor.storageDirectory
        }/courses/videos/${faker.system.commonFileName('mp4')}`;
        await s3.copyObject({
          Key: videoId,
          ACL: 'private',
          Bucket: privateBucket,
          CopySource: lectureVideoSource,
        });
        data.push({
          index: i,
          duration: 15,
          video: videoId,
          courseId: course.id,
          thumbnail: thumbnail,
          lectureGroupId: group.id,
          preview: i === 1 ? true : false,
          instructorId: course.instructorId,
          title: `Lecture ${i} for course ${course.id}`,
          description: `Lecture ${i} description for ${course.title}`,
          attachments: [
            { id: a1, name: 'Attachment 1' },
            { id: a2, name: 'Attachment 2' },
            { id: a3, name: 'Attachment 3' },
          ],
        });
      }
    }
  }

  try {
    const seeds = await prisma.lecture.createMany({ data });
    console.log('Total lectures seeded:', seeds.count);
  } catch (err) {
    console.log('failed to seed lectures');
    console.error(err);
  }
}

async function seedAssignments() {
  const lectures = await prisma.lecture.findMany({
    distinct: 'courseId',
    select: {
      id: true,
      course: {
        select: { instructor: { select: { storageDirectory: true } } },
      },
    },
  });

  if (lectures.length <= 0) {
    console.warn('NO LECTURES FOUND');
    return;
  }
  const filename = `${
    lectures[0].course.instructor.storageDirectory
  }/lectures/assignemnts/attachments/${nanoid(10)}-attachment.zip}`;
  await s3.copyObject({
    Key: filename,
    ACL: 'private',
    Bucket: privateBucket,
    CopySource: attachment1,
  });

  const assignments = lectures.map((l) => {
    return {
      lectureId: l.id,
      minMarks: 10,
      maxMarks: 30,
      deadline: new Date(60 * 60 * 24 * 1000 * 2), //2 days
      title: faker.lorem.words({ min: 5, max: 8 }),
      attachments: [{ id: filename, name: 'Attachment 1' }],
    };
  });

  const { count } = await prisma.assignment.createMany({ data: assignments });
  console.log('Total assignments seeded:', count);
}

// seed bundles
async function seedBundles() {
  const instructors = await prisma.user.findMany({
    where: { role: 'Instructor' },
  });

  // Go through each instructor
  let bundleCount = 1;
  for (const instructor of instructors) {
    // Get all courses belongs to the instructor
    const courses = await prisma.course.findMany({
      where: { instructorId: instructor.id },
    });
    // ignore and continue if there are not more then 2 courses
    // Since bundle require more then 1 course.
    if (!courses || !(courses.length >= 2)) continue;

    const bundleCourses = chunk(shuffle(courses), 2);

    for (const coursesChunk of bundleCourses) {
      // ignore if there are not 2 courses in chunk
      if (coursesChunk.length !== 2) continue;

      const [course1, course2] = coursesChunk;

      const billingType = shuffle(BillingType)[0];
      await prisma.bundle.create({
        data: {
          billingType,
          instructorId: instructor.id,
          title: `Bundle ${bundleCount}`,
          price: billingType === 'Free' ? 0 : random(50),
          courses: {
            connect: [{ id: course1.id }, { id: course2.id }],
          },
        },
      });
      bundleCount += 1;
    }
  }
  console.log('Total bundles seeded:', bundleCount - 1);
}

// seed enrollments
async function seedEnrollments() {
  const enrollments = [];
  const courses = await prisma.course.findMany();
  const students = await prisma.user.findMany({ where: { role: 'Student' } });

  for (const student of students) {
    for (const course of courses) {
      const status = ['Active', 'Archived', 'Completed'][
        faker.number.int({ min: 0, max: 2 })
      ];
      const exp = new Date(new Date().setMonth(random(11) + 1));
      enrollments.push({
        status,
        courseId: course.id,
        studentId: student.id,
        expiry: course.billingType === 'Monthly' ? exp : null,
      });
    }
  }

  const seeds = await prisma.enrollment.createMany({ data: enrollments });
  console.log('Total enrollments seeded:', seeds.count);
}

//seed statements
async function seedStatements() {
  const statements = [];
  const courses = await prisma.course.findMany();
  const bundles = await prisma.bundle.findMany();
  const students = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    where: { role: 'Student' },
  });

  for (const student of students) {
    for (const course of courses) {
      statements.push({
        courseId: course.id,
        amount: course.price,
        userId: student.id,
      });
    }
  }

  for (const student of students) {
    for (const bundle of bundles) {
      statements.push({
        bundleId: bundle.id,
        amount: bundle.price,
        userId: student.id,
      });
    }
  }

  const seeds = await prisma.statement.createMany({ data: statements });
  console.log('Total statements seeded:', seeds.count);
}

// seed associations
async function seedAssociates() {
  const data = [];
  const instructors = await prisma.user.findMany({
    include: { courses: true },
    where: { role: UserRole.Instructor },
  });

  for (const instructor of instructors) {
    const courses = instructor.courses;
    const others = instructors.filter((e) => e.id !== instructor.id);

    for (const course of courses) {
      for (const other of others) {
        data.push({
          courseId: course.id,
          instructorId: other.id,
        });
      }
    }
  }
  try {
    const seeds = await prisma.associate.createMany({ data });
    console.log('Total associates seeded:', seeds.count);
  } catch (err) {
    console.log('failed to create associates');
    console.error(err);
  }
}

// seed reviews
async function seedReviews() {
  const data = [];
  const students = await prisma.user.findMany({
    where: { role: 'Student' },
    include: { enrollments: { include: { course: true } } },
  });

  for (const student of students) {
    const enrollments = student.enrollments;

    for (const enrollment of enrollments) {
      data.push({
        userId: student.id,
        rating: random(1, 5),
        courseId: enrollment.courseId,
        review:
          'Some random review for course. This can be used to describe the content of course by enrolled student.',
      });
    }
  }
  try {
    const seeds = await prisma.review.createMany({ data });
    console.log('Total reviews seeded:', seeds.count);
  } catch (err) {
    console.log('failed to seed reviews.');
    console.error(err);
  }
}

// seed blogs
async function seedBlogs() {
  const categories = await prisma.category.findMany();
  const admin = await prisma.user.findFirst({ where: { role: 'Admin' } });
  const image = 'instructor1/photo-1542856391-010fb87dcfed_sdna7e';
  const content = `Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
    **Lorem Ipsum** is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
    **Lorem Ipsum** is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
    **Lorem Ipsum** is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
    `;

  const _blogs = [];
  for (let i = 1; i <= 100; i++) {
    const category = shuffle(categories)[0];
    _blogs.push({
      image,
      content,
      categoryId: category.id,
      userId: admin.id,
      title: `Title for blog ${i}`,
    });
  }

  try {
    const blogs = await prisma.blog.createMany({ data: _blogs });
    console.log('Total reviews blogs:', blogs.count);
  } catch (err) {
    console.log('failed to seed blogs');
    console.log(err);
  }
}

async function seedBlogComments() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.Student, UserRole.Instructor, UserRole.Organization],
      },
    },
  });
  const blogs = await prisma.blog.findMany({
    where: { deleted: false },
  });

  const tickets = [];
  for (const user of users) {
    for (const blog of blogs) {
      tickets.push(
        prisma.blogComment.create({
          data: {
            blogId: blog.id,
            userId: user.id,
            comment: 'This is blog comment.',
          },
        }),
      );
    }
  }

  try {
    await Promise.all(tickets);
    console.log('Total blog comments seeded', tickets.length);
  } catch (err) {
    console.log('failed to seed blog comments');
    console.log(err);
  }
}

// seed threads
async function seedThreads() {
  const students = await prisma.user.findMany({
    where: { role: UserRole.Student },
  });
  const content = `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
    ![Blog Image description](https://images.unsplash.com/photo-1684176575425-38715409f8d8?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&dl=marek-piwnicki-yauZjCuYO1A-unsplash.jpg)Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
    `;

  const _threads = [];

  for (const student of students) {
    for (let i = 1; i <= 100; i++) {
      _threads.push({
        content,
        userId: student.id,
        title: `Title for threads ${i}`,
      });
    }
  }

  try {
    const blogs = await prisma.thread.createMany({ data: _threads });
    console.log('Total reviews threads:', blogs.count);
  } catch (err) {
    console.log('failed to seed threads');
    console.log(err);
  }
}

async function seedProducts() {
  const products = [];

  for (let i = 1; i <= 100; i++) {
    const price = round(random(0, 50, true), 2);
    const shippingRate = round(random(0, 20, true), 2);
    const virtual = shuffle([true, false])[0];
    const hasAttributes = shuffle([true, false])[0];
    const availability = shuffle(ProductAvailability)[0];
    const category = shuffle(await prisma.category.findMany())[0];

    products.push({
      price,
      virtual,
      availability,
      images: [
        'instructor1/678981_cqpdui',
        'instructor1/27382462-london-wallpapers_tkr3nz',
        'instructor1/6958461-unique-3d-wallpaper_cmdgll',
      ],
      attributes: hasAttributes
        ? {
            colors: ['red', 'blue', 'green'],
            sizes: ['small', 'large', 'xlarge'],
          }
        : {},
      title: `Product ${i}`,
      categoryId: category.id,
      shippingRate: price === 0 ? 0 : shippingRate,
      description: `
        Description for Product ${i} Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
        `,
      specifications: {
        'Skill Level': 'Basic',
        'Age Range': '3-5\n5-8\n8-13',
      },
    });
  }

  try {
    const _products = await prisma.product.createMany({ data: products });
    console.log('Total prouducts seeded:', _products.count);
  } catch (err) {
    console.log('failed to seed products');
    console.log(err);
  }
}

async function seedProductReviews() {
  const products = await prisma.product.findMany();
  const users = await prisma.user.findMany({
    where: { role: { in: [UserRole.Student, UserRole.Instructor] } },
  });

  const reviews = [];
  for (const product of products) {
    for (const user of users) {
      reviews.push({
        userId: user.id,
        productId: product.id,
        rating: random(1, 5, false),
        review: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
      });
    }
  }

  try {
    const _reviews = await prisma.review.createMany({ data: reviews });
    console.log('Total product reviews seeded:', _reviews.count);
  } catch (err) {
    console.log('failed to seed product reviews');
    console.log(err);
  }
}

async function seedTicketsAndComments() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.Student, UserRole.Instructor, UserRole.Organization],
      },
    },
  });
  const courses = await prisma.course.findMany({
    where: { published: true, deleted: false },
  });

  let index = 1;
  const tickets = [];
  for (const user of users) {
    const ticketType =
      user.role === UserRole.Student
        ? shuffle([TicketType.Course, TicketType.Platform])[0]
        : TicketType.Platform;

    tickets.push(
      prisma.ticket.create({
        data: {
          userId: user.id,
          type: ticketType,
          status: TicketStatus.Opened,
          subject: `Ticket ${index} subject.`,
          courseId:
            ticketType === TicketType.Course
              ? shuffle(courses)[0].id
              : undefined,
          ticketComments: {
            create: {
              userId: user.id,
              comment: `Ticket ${index} comment`,
            },
          },
        },
      }),
    );

    index += 1;
  }

  try {
    await Promise.all(tickets);
    console.log('Total ticket seeded', tickets.length);
  } catch (err) {
    console.log('failed to seed tickets');
    console.log(err);
  }
}

async function seedRewardPoints() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.Student, UserRole.Instructor, UserRole.Organization],
      },
    },
  });

  const _rewards = [];

  for (const user of users) {
    const reason = shuffle(defaultConditions)[0].title;
    _rewards.push({
      reason,
      points: 10,
      userId: user.id,
      type: RewardPointsType.Earn,
    });
    _rewards.push({
      points: 5,
      userId: user.id,
      reason: 'Points reedemed',
      type: RewardPointsType.Spent,
    });
  }

  try {
    const rewards = await prisma.rewardPoints.createMany({
      data: _rewards,
    });
    console.log('Total reward points seeded', rewards.count);
  } catch (err) {
    console.log('failed to seed reward points');
    console.log(err);
  }
}

async function seedStoreOrders() {
  const users = await prisma.user.findMany({
    where: { role: { in: [UserRole.Instructor, UserRole.Student] } },
  });
  const products = await prisma.product.findMany({
    where: { availability: ProductAvailability.InStock },
  });

  const fut = [];
  for (const user of users) {
    fut.push(
      prisma.storeOrder.create({
        data: {
          amount: 100,
          userId: user.id,
          status: 'Paid',
          products: {
            createMany: { data: products.map((p) => ({ productId: p.id })) },
          },
        },
      }),
    );
  }
  try {
    const res = await Promise.all(fut);
    console.log('Total store orders seeded', res.length);
  } catch (err) {
    console.log('failed to seed store orders');
    console.log(err);
  }
}

main();
