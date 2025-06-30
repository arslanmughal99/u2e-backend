SELECT
      c.id,
      c.title,
      c.price,
      c.thumbnail,
      c."billingType",
      c.description,
      c.created_at AS "createdAt",
      COALESCE(ROUND(AVG(r.rating), 2), 0) AS rating,
      COUNT(DISTINCT l.id) AS lectures,
      ct.id AS "categoryId",
      ct.title AS "categoryTitle",
      asu.id AS "associateId",
      asu.fullname AS "associateFullname",
      asu.profile_image AS "associateProfileImage",
      org.id AS "organizationId",
      org.name AS "organizationName",
      en.expiry AS "enrollmentExpiry",
      en.created_at AS "enrollmentCreatedAt"
    FROM
      "Course" c
      LEFT JOIN "Lecture" l ON c.id = l."courseId"
      LEFT JOIN "Review" r ON c.id = r."courseId"
      LEFT JOIN "Category" ct ON ct.id = c."categoryId"
      LEFT JOIN "Enrollment" en ON en."courseId" = c.id
      LEFT JOIN "User" u ON u.id = en."studentId"
      LEFT JOIN "Organization" org ON org.id = c."organizationId"
      LEFT JOIN "Associate" a ON c.id = a."courseId"
      LEFT JOIN "User" asu ON asu.id = a."instructorId"
    WHERE
      c.published = true
      ${
        typeFilter === CourseType.Organization
          ? 'AND c."organizationId" IS NOT NULL'
          : ''
      }
      ${
        typeFilter === CourseType.Instructor
          ? 'AND c."instructorId" IS NULL'
          : ''
      }
      ${categoryId ? `AND ct.id = ${categoryId}` : ''}
    GROUP BY
      c.id,
      ct.id,
      asu.id,
      org.id,
      en.expiry,
      en.created_at
    ORDER BY
      c.id DESC
    OFFSET 0
    LIMIT 1000;