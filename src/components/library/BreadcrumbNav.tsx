import { Link } from 'react-router-dom';
import { ChevronRight, Home, Library } from 'lucide-react';
import { Folder } from '@/types/library';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbNavProps {
  folders: Folder[];
  currentFolder?: Folder | null;
}

export function BreadcrumbNav({ folders, currentFolder }: BreadcrumbNavProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/biblioteca" className="flex items-center gap-1">
              <Library className="h-4 w-4" />
              <span>Biblioteca</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {folders.map((folder, index) => (
          <BreadcrumbItem key={folder.id}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            {index === folders.length - 1 && !currentFolder ? (
              <BreadcrumbPage>{folder.name}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={`/biblioteca/pasta/${folder.id}`}>
                  {folder.name}
                </Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}

        {currentFolder && (
          <BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbPage>{currentFolder.name}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
