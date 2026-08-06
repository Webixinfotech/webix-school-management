import { useAuth } from '../../context/AuthContext';
import { homeworks, classes, teachers } from '../../data/schoolData';

const ParentHomeworkPage = () => {
  const { user } = useAuth();
  const child = user?.children?.[0] || {};
  
  const classInfo = classes.find(c => c.id === child.classId);
  const childHomeworks = homeworks.filter(hw => hw.classId === child.classId);

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || '-';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Homework</h1>
        <p className="text-gray-500 mt-1">View {child.name}'s homework and assignments</p>
      </div>

      {/* Class Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <p className="text-gray-500">Class: <span className="font-medium text-gray-800">{classInfo?.name || '-'}</span></p>
      </div>

      {/* Homework List */}
      <div className="space-y-4">
        {childHomeworks.length > 0 ? (
          childHomeworks.map((hw) => (
            <div key={hw.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                      {hw.subject}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{hw.description}</h3>
                  <p className="text-sm text-gray-500 mt-2">Assigned by: {getTeacherName(hw.assignedBy)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-600 font-medium">Due: {hw.dueDate}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            No homework assigned yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentHomeworkPage;
